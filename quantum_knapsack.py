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
    """
    Given a budget and costs and impacts, return the optimal solution in a list
    """
    from qiskit_optimization.applications import Knapsack
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    from qiskit_optimization.minimum_eigensolvers import QAOA, NumPyMinimumEigensolver
    from qiskit_aer.primitives import Sampler
    from qiskit_algorithms.optimizers import COBYLA

    # Build problem
    prob = Knapsack(values=impact, weights=costs, max_weight=budget)
    qp = prob.to_quadratic_program()
    print("Quadratic Program:")
    print(qp.prettyprint())

    # Classical baseline
    meo_classical = MinimumEigenOptimizer(min_eigen_solver=NumPyMinimumEigensolver())
    result_classical = meo_classical.solve(qp)
    print("\nClassical (NumPyMinimumEigensolver):")
    print(result_classical.prettyprint())
    print("solution:", prob.interpret(result_classical))

    # Quantum simulator with QAOA
    sampler = Sampler()
    qaoa = QAOA(sampler=sampler, optimizer=COBYLA(maxiter=100), reps=1)

    meo_qaoa = MinimumEigenOptimizer(qaoa)
    result_qaoa = meo_qaoa.solve(qp)
    print("\nQuantum (QAOA with AerSampler):")
    print(result_qaoa.prettyprint())
    print("solution:", prob.interpret(result_qaoa))

    # Return the QAOA solution
    return prob.interpret(result_classical), prob.interpret(result_qaoa)


import asyncio
if __name__ == "__main__":
    import random
    impact = [int(random.random()*100) for i in range(10)]
    costs = [int(random.random()*100) for i in range(10)]

    soln = asyncio.run(run_knapsack(100, impact, costs))
    print(soln)
