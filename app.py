from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import asyncio
import os
from quantum_knapsack import run_knapsack

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS)"""
    return send_from_directory('frontend', filename)

@app.route('/models/<path:filename>')
def serve_models(filename):
    """Serve 3D model files"""
    return send_from_directory('models', filename)

@app.route('/run_knapsack', methods=['POST'])
def run_knapsack_endpoint():
    """
    Handle the quantum knapsack optimization request
    Expected JSON payload:
    {
        "criteria": "child_mortality",
        "budget": 100000,
        "impact": [85, 92, 78, 95, 67, 88, 73, 91],
        "costs": [45000, 52000, 38000, 58000, 32000, 48000, 41000, 55000],
        "locations": ["Hospital A", "Hospital B", ...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Extract parameters
        criteria = data.get('criteria')
        budget = data.get('budget')
        impact = data.get('impact')
        costs = data.get('costs')
        locations = data.get('locations', [])
        
        # Validate inputs
        if not all([criteria, budget, impact, costs]):
            return jsonify({'error': 'Missing required parameters: criteria, budget, impact, costs'}), 400
        
        if not isinstance(budget, int) or budget <= 0:
            return jsonify({'error': 'Budget must be a positive integer'}), 400
        
        if not isinstance(impact, list) or not isinstance(costs, list):
            return jsonify({'error': 'Impact and costs must be lists'}), 400
        
        if len(impact) != len(costs):
            return jsonify({'error': 'Impact and costs lists must have the same length'}), 400
        
        # Run the quantum knapsack optimization
        try:
            solution = asyncio.run(run_knapsack(budget, impact, costs))
            
            # Format the response
            response = {
                'success': True,
                'criteria': criteria,
                'budget': budget,
                'solution': solution,
                'locations': locations,
                'total_locations': len(impact),
                'message': 'Optimization completed successfully'
            }
            
            return jsonify(response)
            
        except Exception as quantum_error:
            # # If quantum computation fails, provide a fallback classical solution
            # print(f"Quantum computation error: {quantum_error}")
            
            # # Simple greedy algorithm as fallback
            # items = list(zip(range(len(impact)), impact, costs))
            # items.sort(key=lambda x: x[1]/x[2], reverse=True)  # Sort by impact/cost ratio
            
            # selected = [0] * len(impact)
            # total_cost = 0
            
            # for idx, imp, cost in items:
            #     if total_cost + cost <= budget:
            #         selected[idx] = 1
            #         total_cost += cost
            
            # response = {
            #     'success': True,
            #     'criteria': criteria,
            #     'budget': budget,
            #     'solution': selected,
            #     'locations': locations,
            #     'total_locations': len(impact),
            #     'message': 'Optimization completed using classical fallback (quantum backend unavailable)',
            #     'fallback_used': True
            # }
            response = {
                'success': False
            }
            
            return jsonify(response)
    
    except Exception as e:
        print(f"Error in run_knapsack_endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'An error occurred during optimization'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("Starting Quantum Knapsack Optimization Server...")
    print("Frontend available at: http://localhost:8080")
    print("API endpoint: http://localhost:8080/run_knapsack")
    app.run(debug=True, host='0.0.0.0', port=8080)
