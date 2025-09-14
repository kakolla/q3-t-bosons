document.addEventListener('DOMContentLoaded', function() {
    const runButton = document.getElementById('run-optimization');
    const criteriaSelect = document.getElementById('criteria');
    const budgetInput = document.getElementById('budget');
    const resultsSection = document.getElementById('results-section');
    const resultDisplay = document.getElementById('result-display');
    const csvContent = document.getElementById('csv-content');

    // Sample data for different criteria
    const sampleData = {
        child_mortality: {
            locations: ['Hospital A', 'Hospital B', 'Hospital C', 'Hospital D', 'Hospital E', 'Hospital F', 'Hospital G', 'Hospital H'],
            impacts: [85, 92, 78, 95, 67, 88, 73, 91],
            costs: [45000, 52000, 38000, 58000, 32000, 48000, 41000, 55000]
        },
        population: {
            locations: ['Clinic A', 'Clinic B', 'Clinic C', 'Clinic D', 'Clinic E', 'Clinic F', 'Clinic G', 'Clinic H'],
            impacts: [120, 98, 156, 87, 134, 76, 145, 102],
            costs: [62000, 48000, 71000, 39000, 68000, 35000, 74000, 51000]
        },
        medically_underserved: {
            locations: ['Center A', 'Center B', 'Center C', 'Center D', 'Center E', 'Center F', 'Center G', 'Center H'],
            impacts: [95, 88, 102, 79, 91, 84, 97, 86],
            costs: [55000, 47000, 61000, 42000, 58000, 44000, 63000, 49000]
        },
        rural_access: {
            locations: ['Facility A', 'Facility B', 'Facility C', 'Facility D', 'Facility E', 'Facility F', 'Facility G', 'Facility H'],
            impacts: [78, 95, 82, 89, 76, 93, 85, 90],
            costs: [38000, 56000, 41000, 52000, 36000, 59000, 43000, 54000]
        },
        elderly_population: {
            locations: ['Unit A', 'Unit B', 'Unit C', 'Unit D', 'Unit E', 'Unit F', 'Unit G', 'Unit H'],
            impacts: [88, 76, 94, 81, 87, 92, 79, 85],
            costs: [49000, 38000, 57000, 43000, 51000, 60000, 40000, 46000]
        },
        poverty_rate: {
            locations: ['Site A', 'Site B', 'Site C', 'Site D', 'Site E', 'Site F', 'Site G', 'Site H'],
            impacts: [92, 85, 98, 74, 89, 96, 82, 91],
            costs: [53000, 45000, 62000, 35000, 50000, 64000, 42000, 56000]
        }
    };

    // Update CSV display when criteria changes
    criteriaSelect.addEventListener('change', updateCSVDisplay);

    function updateCSVDisplay() {
        const selectedCriteria = criteriaSelect.value;
        const data = sampleData[selectedCriteria];
        
        let csvText = 'Location,Impact,Cost,Selected\n';
        for (let i = 0; i < data.locations.length; i++) {
            csvText += `${data.locations[i]},${data.impacts[i]},${data.costs[i]},false\n`;
        }
        
        csvContent.textContent = csvText;
    }

    // Initialize with default data
    updateCSVDisplay();

    // Handle optimization button click
    runButton.addEventListener('click', async function() {
        const criteria = criteriaSelect.value;
        const budget = parseInt(budgetInput.value);

        if (!budget || budget <= 0) {
            alert('Please enter a valid budget amount');
            return;
        }

        // Disable button and show loading state
        runButton.disabled = true;
        runButton.innerHTML = '<span class="loading"></span>Running Optimization...';

        try {
            // For Population criteria, use CSV-based optimization
            let requestBody;
            if (criteria === 'population') {
                requestBody = {
                    criteria: 'Population',  // Note: capitalize for backend
                    budget: budget
                };
            } else {
                // For other criteria, use sample data
                const data = sampleData[criteria];
                requestBody = {
                    criteria: criteria,
                    budget: budget,
                    impact: data.impacts,
                    costs: data.costs,
                    locations: data.locations
                };
            }
            
            const response = await fetch('/run_knapsack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Display results
            if (criteria === 'population') {
                displayCSVResults(result);
            } else {
                displayResults(result, data);
            }
            
        } catch (error) {
            console.error('Error:', error);
            resultDisplay.textContent = `Error: ${error.message}\n\nPlease make sure the Flask backend is running.`;
            resultsSection.style.display = 'block';
        } finally {
            // Re-enable button
            runButton.disabled = false;
            runButton.innerHTML = 'Run Optimization';
        }
    });

    function displayCSVResults(result) {
        let resultText = `Optimization Results for ${result.criteria}\n`;
        resultText += `Budget: $${budgetInput.value}\n\n`;
        
        if (result.success && result.selected_count > 0) {
            resultText += 'Selected Locations:\n';
            
            for (let i = 0; i < result.locations.length; i++) {
                resultText += `✓ ${result.locations[i]} (${result.cities[i]})\n`;
            }
            
            resultText += `\nTotal Cost: $${result.total_cost}`;
            resultText += `\nTotal Impact: ${result.total_impact}`;
            resultText += `\nPopulation Reached: ${result.population_reached.toLocaleString()} people`;
            resultText += `\nBudget Utilization: ${result.budget_utilization.toFixed(1)}%`;
            resultText += `\nRemaining Budget: $${result.budget - result.total_cost}`;
            resultText += `\nMethod Used: ${result.method_used}`;
            
        } else {
            resultText += 'No optimal solution found within the given budget.';
        }

        resultDisplay.textContent = resultText;
        resultsSection.style.display = 'block';
        
        // Update CSV display for population criteria
        updateCSVForPopulation(result);
    }

    function displayResults(result, data) {
        let resultText = `Optimization Results for ${criteriaSelect.options[criteriaSelect.selectedIndex].text}\n`;
        resultText += `Budget: $${budgetInput.value}\n\n`;
        
        if (result.solution && result.solution.length > 0) {
            resultText += 'Selected Locations:\n';
            let totalCost = 0;
            let totalImpact = 0;
            
            result.solution.forEach((index, i) => {
                if (index === 1) { // Selected
                    resultText += `✓ ${data.locations[i]} - Impact: ${data.impacts[i]}, Cost: $${data.costs[i]}\n`;
                    totalCost += data.costs[i];
                    totalImpact += data.impacts[i];
                }
            });
            
            resultText += `\nTotal Cost: $${totalCost}`;
            resultText += `\nTotal Impact: ${totalImpact}`;
            resultText += `\nRemaining Budget: $${parseInt(budgetInput.value) - totalCost}`;
            
            if (result.classical_solution) {
                resultText += '\n\nClassical vs Quantum Comparison:\n';
                resultText += `Classical Solution: ${result.classical_solution}\n`;
                resultText += `Quantum Solution: ${result.solution}`;
            }
        } else {
            resultText += 'No optimal solution found within the given budget.';
        }

        resultDisplay.textContent = resultText;
        resultsSection.style.display = 'block';
        
        // Update CSV display to show selected items
        updateCSVWithResults(result.solution, data);
    }

    function updateCSVForPopulation(result) {
        let csvText = 'Hospital,City,Population Impact,Cost,Selected\n';
        if (result.success && result.locations) {
            for (let i = 0; i < result.total_locations; i++) {
                const isSelected = result.solution[i] === 1;
                const hospitalName = isSelected ? result.locations[result.solution.slice(0, i).reduce((a, b) => a + b, 0)] : 'N/A';
                const cityName = isSelected ? result.cities[result.solution.slice(0, i).reduce((a, b) => a + b, 0)] : 'N/A';
                csvText += `Hospital ${i + 1},${cityName},${isSelected ? 'Selected' : 'Not Selected'},${isSelected ? 'Selected' : 'Not Selected'},${isSelected}\n`;
            }
        }
        csvContent.textContent = csvText;
    }

    function updateCSVWithResults(solution, data) {
        let csvText = 'Location,Impact,Cost,Selected\n';
        for (let i = 0; i < data.locations.length; i++) {
            const selected = solution && solution[i] === 1 ? 'true' : 'false';
            csvText += `${data.locations[i]},${data.impacts[i]},${data.costs[i]},${selected}\n`;
        }
        csvContent.textContent = csvText;
    }
});
