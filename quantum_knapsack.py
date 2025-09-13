
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




async def run_knapsack(budget: int, impact: list[int], costs: list[int]) -> list[int]:
    """
    Given a budget and costs and impacts, return the optimal solution in a list
    """
    opt = []

    await ibm_setup()
    from qiskit_optimization.applications import Knapsack
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    from qiskit_optimization.minimum_eigensolvers import QAOA, NumPyMinimumEigensolver

    prob = Knapsack(values=impact, weights=costs, max_weight=budget)
    qp = prob.to_quadratic_program()
    print(qp.prettyprint())

    # Solve knapsack
    # Numpy Eigensolver
    meo = MinimumEigenOptimizer(min_eigen_solver=NumPyMinimumEigensolver())
    result = meo.solve(qp)
    print(result.prettyprint())
    print("\nsolution:", prob.interpret(result))
    opt = prob.interpret(result)



    return opt


import asyncio
if __name__ == "__main__":
    soln = asyncio.run(run_knapsack(100, [3,4,5,6,7,8,9,10], [2,3,4,5,6,7,8,9]))
    print(soln)
