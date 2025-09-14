from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import asyncio
import os
from quantum_knapsack import run_knapsack_with_csv

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory(os.path.join(os.getcwd(), 'frontend'), 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS)"""
    return send_from_directory(os.path.join(os.getcwd(), 'frontend'), filename)

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
        
        # Validate basic inputs
        if not criteria or budget is None:
            return jsonify({'error': 'Missing required parameters: criteria, budget'}), 400
        
        if not isinstance(budget, int) or budget <= 0:
            return jsonify({'error': 'Budget must be a positive integer'}), 400
        
        # Check if using CSV data (no impact/costs provided, only criteria and budget)
        if not impact and not costs:
            # Use CSV-based optimization for any criteria
            try:
                response = asyncio.run(run_knapsack_with_csv(budget, criteria))
                return jsonify(response)
            except Exception as csv_error:
                print(f"CSV optimization error: {csv_error}")
                return jsonify({
                    'success': False,
                    'error': str(csv_error),
                    'message': 'CSV-based optimization failed'
                }), 500
        
        # Validate manual data inputs
        if not isinstance(impact, list) or not isinstance(costs, list):
            return jsonify({'error': 'Impact and costs must be lists'}), 400
        
        if len(impact) != len(costs):
            return jsonify({'error': 'Impact and costs lists must have the same length'}), 400
        
        # Original manual data optimization
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
            print(f"Quantum computation error: {quantum_error}")
            return jsonify({
                'success': False,
                'error': str(quantum_error),
                'message': 'Quantum optimization failed'
            }), 500
    
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
    port = int(os.environ.get('PORT', 8080))
    print("Starting Quantum Knapsack Optimization Server...")
    print(f"Frontend available at: http://localhost:{port}")
    print(f"API endpoint: http://localhost:{port}/run_knapsack")
    app.run(debug=True, host='0.0.0.0', port=port)
