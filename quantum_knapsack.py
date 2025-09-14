from typing import Tuple
async def ibm_setup():
    from dotenv import load_dotenv
    import os
    load_dotenv()

    from qiskit_ibm_runtime import QiskitRuntimeService

    api_key = os.getenv("api_key")
    crn = os.getenv("crn")

    # connect to backend
    QiskitRuntimeService.save_account(
        channel="ibm_cloud",
        token=api_key,
        instance=crn,
        overwrite=True
    )
    # Check that the account has been saved properly
    service = QiskitRuntimeService()
    service.saved_accounts()

    # check backends
    service.backends()


# impact[i] = number of ppl / benefit of this city/hospital
# costs[i] = cost to develop MRI infrastructure in that area
# budget = total budget we have
# output: list of optimal places to place an MRI

async def run_knapsack(budget: int, impact: list[int], costs: list[int]) -> Tuple[list[int], list[int]]:
    # Try to import and run quantum optimization, with fallbacks
    try:
        # First try the direct approach that works in notebooks
        import sys
        import importlib
        
        # Try to patch the missing module temporarily
        if 'qiskit.exceptions' not in sys.modules:
            # Create a dummy exceptions module
            import types
            dummy_exceptions = types.ModuleType('qiskit.exceptions')
            dummy_exceptions.QiskitError = Exception
            sys.modules['qiskit.exceptions'] = dummy_exceptions
            sys.modules['qiskit'] = types.ModuleType('qiskit')
            sys.modules['qiskit'].exceptions = dummy_exceptions
        
        from qiskit_optimization.applications import Knapsack
        from qiskit_optimization.algorithms import MinimumEigenOptimizer
        from qiskit_optimization.minimum_eigensolvers import QAOA, NumPyMinimumEigensolver
        from qiskit_algorithms.optimizers import COBYLA
        
        try:
            from qiskit_aer.primitives import SamplerV2 as Sampler
        except ImportError:
            try:
                from qiskit_aer.primitives import Sampler
            except ImportError:
                from qiskit.primitives import Sampler

        prob = Knapsack(values=impact, weights=costs, max_weight=budget)
        qp = prob.to_quadratic_program()

        # Classical solution
        meo_classical = MinimumEigenOptimizer(min_eigen_solver=NumPyMinimumEigensolver())
        result_classical = meo_classical.solve(qp)

        # Quantum solution
        try:
            sampler = Sampler()
            qaoa = QAOA(sampler=sampler, optimizer=COBYLA(maxiter=100), reps=1)
            meo_qaoa = MinimumEigenOptimizer(qaoa)
            result_qaoa = meo_qaoa.solve(qp)
            
            return prob.interpret(result_classical), prob.interpret(result_qaoa)
        except Exception as e:
            print(f"Quantum solver failed: {e}")
            # Return classical solution twice if quantum fails
            return prob.interpret(result_classical), prob.interpret(result_classical)
            
    except Exception as e:
        print(f"Qiskit optimization import failed: {e}")
        items = list(zip(range(len(impact)), impact, costs))
        items.sort(key=lambda x: x[1]/x[2], reverse=True)
        
        solution = []
        total_cost = 0
        
        for idx, imp, cost in items:
            if total_cost + cost <= budget:
                solution.append(idx)
                total_cost += cost
        
        return solution, solution


async def run_knapsack_with_csv(budget: int, criteria: str = 'Population') -> dict:
    """
    Load CSV data, process it based on criteria, and run quantum knapsack optimization
    """
    import polars as pl
    import nest_asyncio
    
    # try:
    #     nest_asyncio.apply()
    # except:
    #     pass  # Already applied
    
    # Load and process CSV data
    csv = pl.read_csv('data/medically_underserved_data.csv', ignore_errors=True)
    
    # Map criteria to column names and normalization factors
    criteria_mapping = {
        'Population': ('Population', 1000, 'Pop'),
        'total_beds': ('total_beds', 1, 'Beds'),
        'coronary_death': ('Population', 1000, 'Pop'),  # Fallback to population for now
        'medically_underserved': ('Population', 1000, 'Pop'),  # Fallback to population
        'rural_access': ('Population', 1000, 'Pop'),  # Fallback to population
        'accidental_death': ('Population', 1000, 'Pop')  # Fallback to population
    }
    
    # Get the appropriate column and normalization factor
    impact_column, normalization_factor, display_name = criteria_mapping.get(criteria, ('Population', 1000, 'Pop'))
    
    data = csv.select([impact_column, 'Hospital_Cost', 'facility_name', 'City', 'State']).drop_nulls()
    data = data.limit(20)
    
    impact_values = data[impact_column].to_list()
    hospital_costs = data['Hospital_Cost'].to_list()
    facility_names = data['facility_name'].to_list()
    cities = data['City'].to_list()
    states = data['State'].to_list()
    
    print('Raw data sample:')
    for i in range(min(5, len(facility_names))):
        print(f'{facility_names[i][:30]}... {display_name}: {impact_values[i]:,}, Cost: ${hospital_costs[i]:,}')
    
    # Normalize values as requested
    impact = [max(1, int(val / normalization_factor)) for val in impact_values]
    costs = [max(1, int(cost / 100000000)) for cost in hospital_costs]
    
    print(f'\nNormalized data:')
    print(f'Impact ({criteria} normalized): {impact}')
    print(f'Costs (scaled units): {costs}')
    
    print(f'\nCriteria: {criteria}')
    print(f'Budget: {budget} units')
    
    # Run quantum optimization
    print(f'\nRunning quantum knapsack optimization...')
    try:
        # Get both solutions
        classical_solution, quantum_solution = await run_knapsack(budget, impact, costs)
        
        # Check feasibility of both solutions
        classical_cost = sum(costs[i] for i in classical_solution)
        quantum_cost = sum(costs[i] for i in quantum_solution)
        
        # Choose the best feasible solution (quantum might have errs or be infeasible)
        if classical_cost <= budget and quantum_cost <= budget:
            # Both feasible, choose the one with higher impact
            classical_impact = sum(impact[i] for i in classical_solution)
            quantum_impact = sum(impact[i] for i in quantum_solution)
            
            if quantum_impact >= classical_impact:
                final_solution = quantum_solution
                method = "Quantum (better impact)"
            else:
                final_solution = classical_solution
                method = "Classical (better impact)"
        elif classical_cost <= budget:
            final_solution = classical_solution
            method = "Classical (quantum infeasible)"
        elif quantum_cost <= budget:
            final_solution = quantum_solution
            method = "Quantum (classical infeasible)"
        else:
            print("both solutions exceed budget, just use classical")
            final_solution = classical_solution
            method = "Classical (forced)"
        
        print(f'Selected method: {method}')
        
    except Exception as e:
        print(f'Error: {e}')
        # Fallback to manual classical solution
        items = list(zip(range(len(impact)), impact, costs))
        items.sort(key=lambda x: x[1]/x[2], reverse=True)
        
        final_solution = []
        total_cost = 0
        
        for idx, imp, cost in items:
            if total_cost + cost <= budget:
                final_solution.append(idx)
                total_cost += cost
        
        method = "Classical (fallback)"
    
    # Convert solution indices to binary vector
    solution_vector = [0] * len(impact)
    for idx in final_solution:
        if idx < len(solution_vector):
            solution_vector[idx] = 1
    
    # Display results
    selected_hospitals = []
    selected_locations = []
    total_impact = 0
    total_cost = 0
    
    for i, selected in enumerate(solution_vector):
        if selected == 1:
            selected_hospitals.append(facility_names[i])
            selected_locations.append(f"{cities[i]}, {states[i]}")
            total_impact += impact[i]
            total_cost += costs[i]
    
    print(f'\n******Optimization Results*******')
    print(f'Solution indices: {final_solution}')
    print(f'Solution vector: {solution_vector}')
    print(f'Selected {len(selected_hospitals)} hospitals:')
    for hospital in selected_hospitals:
        print(f'- {hospital}')
    
    print(f'\nTotal population reached: {total_impact * 1000:,} people')
    print(f'Total cost: {total_cost}/{budget} units')
    if total_cost <= budget:
        print(f'Budget utilization: {(total_cost/budget)*100:.1f}%')
    else:
        print(f'Cost exceeds budget by {total_cost - budget} units!')
    
    # Return results in format expected by frontend
    
    return {
        'success': True,
        'criteria': criteria,
        'budget': budget,
        'solution': solution_vector,
        'locations': selected_hospitals,
        'cities': selected_locations,
        'total_locations': len(impact),
        'selected_count': len(selected_hospitals),
        'total_impact': total_impact,
        'total_cost': total_cost,
        'budget_utilization': (total_cost/budget)*100 if budget > 0 else 0,
        'population_reached': total_impact * 1000,
        'method_used': method,
        'message': f'Optimization completed using {method} method'
    }


import asyncio
if __name__ == "__main__":
    import random
    impact = [int(random.random()*100) for i in range(10)]
    costs = [int(random.random()*100) for i in range(10)]

    soln = asyncio.run(run_knapsack(100, impact, costs))
    print(soln)
