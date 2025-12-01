const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Your API Key
const GEMINI_API_KEY = 'AIzaSyCOMnRJYgxAGL8mowLyzIrMyizH-CfOpug';

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'MediScan AI',
        version: '2.0.0',
        features: ['symptom-analysis', 'dark-mode', 'detailed-results'],
        timestamp: new Date().toISOString(),
        gemini_api: 'configured'
    });
});

// Enhanced analysis endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { symptoms, age } = req.body;

        console.log('Received analysis request:');
        console.log('   Age:', age);
        console.log('   Symptoms:', symptoms);

        // Enhanced validation
        if (!symptoms || !age) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['symptoms', 'age'],
            });
        }

        // Prepare the prompt for Gemini
        const prompt = `
        Act as a medical symptom checker. Analyze these symptoms and provide:
        
        Patient Age: ${age}
        Symptoms: ${symptoms}
        
        Please provide:
        1. TOP 3 possible conditions (with confidence percentages)
        2. Recommended urgency level (Emergency, Urgent Care, Primary Care, Self-Care)
        3. Specific recommendations for each condition
        4. When to seek immediate medical attention
        
        Format as JSON with this structure:
        {
            "conditions": [
                {
                    "name": "Condition name",
                    "confidence": "percentage",
                    "description": "Brief description",
                    "recommendations": ["rec1", "rec2", "rec3"]
                }
            ],
            "urgency": "urgency level",
            "immediateAttention": ["when to seek help"]
        }
        `;

        console.log('Calling Gemini API...');
        
        // Call Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        // Parse the response
        const resultText = response.data.candidates[0].content.parts[0].text;
        
        // Try to extract JSON from the response
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            res.json({
                success: true,
                analysis: result,
                rawResponse: resultText
            });
        } else {
            // Fallback to raw text
            res.json({
                success: true,
                analysis: {
                    conditions: [{ name: "Analysis Complete", description: resultText }],
                    urgency: "Consult results",
                    immediateAttention: ["If symptoms worsen"]
                }
            });
        }

    } catch (error) {
        console.error('Analysis error:', error.message);
        
        // Fallback to local symptom database if API fails
        const fallbackResult = getLocalAnalysis(req.body.symptoms, req.body.age);
        res.json({
            success: true,
            analysis: fallbackResult,
            note: "Using local analysis (API unavailable)"
        });
    }
});

// Local symptom database for fallback
function getLocalAnalysis(symptoms, age) {
    const symptomsLower = symptoms.toLowerCase();
    
    const conditions = [];
    
    // Check for common conditions
    if (symptomsLower.includes('fever') && symptomsLower.includes('cough')) {
        conditions.push({
            name: "Influenza (Flu)",
            confidence: "75%",
            description: "Viral infection affecting respiratory system",
            recommendations: ["Rest and stay hydrated", "Consider antiviral medications", "Use fever reducers as needed"]
        });
    }
    
    if (symptomsLower.includes('runny nose') || symptomsLower.includes('sneezing')) {
        conditions.push({
            name: "Common Cold",
            confidence: "70%",
            description: "Viral upper respiratory infection",
            recommendations: ["Get plenty of rest", "Stay hydrated", "Use over-the-counter cold medications"]
        });
    }
    
    if (symptomsLower.includes('sore throat') && symptomsLower.includes('fever')) {
        conditions.push({
            name: "Strep Throat",
            confidence: "65%",
            description: "Bacterial throat infection",
            recommendations: ["See doctor for strep test", "Complete antibiotics if prescribed", "Gargle warm salt water"]
        });
    }
    
    if (symptomsLower.includes('shortness of breath') || symptomsLower.includes('chest pain')) {
        conditions.push({
            name: "Seek Immediate Care",
            confidence: "90%",
            description: "These symptoms require urgent evaluation",
            recommendations: ["Go to emergency room", "Call emergency services if severe"]
        });
    }
    
    // Add default if no matches
    if (conditions.length === 0) {
        conditions.push({
            name: "General Medical Advice",
            confidence: "N/A",
            description: "Based on your symptoms, general advice includes:",
            recommendations: ["Monitor symptoms closely", "Stay hydrated", "Rest as needed", "Consult healthcare provider if symptoms persist"]
        });
    }
    
    // Determine urgency
    let urgency = "Self-Care";
    if (symptomsLower.includes('emergency') || symptomsLower.includes('severe pain') || symptomsLower.includes('bleeding')) {
        urgency = "Emergency";
    } else if (symptomsLower.includes('fever') && age > 65) {
        urgency = "Urgent Care";
    } else if (symptomsLower.includes('persistent') || symptomsLower.includes('worsening')) {
        urgency = "Primary Care";
    }
    
    return {
        conditions,
        urgency,
        immediateAttention: [
            "Difficulty breathing",
            "Chest pain or pressure",
            "Severe bleeding",
            "Sudden confusion",
            "High fever that doesn't respond to medication"
        ]
    };
}

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log('===========================================');
    console.log('   MediScan AI Server Started Successfully!');
    console.log('   Local: http://localhost:' + PORT);
    console.log('   API: http://localhost:' + PORT + '/api/health');
    console.log('   Gemini API: Configured');
    console.log('   Serving from: ' + __dirname);
    console.log('===========================================');
});
