class MediScanApp {
    constructor() {
        // Get all DOM elements
        this.form = document.getElementById('symptomForm');
        this.ageInput = document.getElementById('age');
        this.symptomsInput = document.getElementById('symptoms');
        this.charCount = document.getElementById('charCount');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.newAnalysisBtn = document.getElementById('newAnalysisBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.inputSection = document.getElementById('inputSection');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContent = document.getElementById('resultsContent');

        // State
        this.currentSymptoms = '';
        this.currentAge = 0;
        this.isDarkMode = localStorage.getItem('theme') === 'dark';

        // Initialize
        this.init();
    }

    init() {
        console.log('Initializing MediScan AI...');
        this.setupEventListeners();
        this.updateCharCount();
        this.setupDarkMode();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Character count update
        this.symptomsInput.addEventListener('input', () => this.updateCharCount());

        // New analysis button
        if (this.newAnalysisBtn) {
            this.newAnalysisBtn.addEventListener('click', () => this.resetForm());
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Age input validation
        this.ageInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            if (value < 1) e.target.value = 1;
            if (value > 120) e.target.value = 120;
        });
    }

    updateCharCount() {
        if (this.charCount) {
            this.charCount.textContent = this.symptomsInput.value.length;
        }
    }

    setupDarkMode() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeToggle(true);
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            this.updateThemeToggle(false);
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        
        this.updateThemeToggle(this.isDarkMode);
    }

    updateThemeToggle(isDark) {
        if (!this.themeToggle) return;
        
        const icon = this.themeToggle.querySelector('i');
        const text = this.themeToggle.querySelector('span');
        
        if (isDark) {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const age = this.ageInput.value.trim();
        const symptoms = this.symptomsInput.value.trim();

        if (!age || !symptoms) {
            alert('Please fill in both age and symptoms');
            return;
        }

        // Store current values
        this.currentAge = age;
        this.currentSymptoms = symptoms;

        // Show loading, hide input
        this.inputSection.style.display = 'none';
        this.loadingSection.style.display = 'block';
        this.resultsSection.style.display = 'none';

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ age, symptoms })
            });

            const data = await response.json();
            
            // Hide loading, show results
            this.loadingSection.style.display = 'none';
            this.resultsSection.style.display = 'block';
            
            this.displayResults(data);
            
        } catch (error) {
            console.error('Error:', error);
            this.loadingSection.style.display = 'none';
            this.inputSection.style.display = 'block';
            alert('Sorry, there was an error analyzing your symptoms. Please try again.');
        }
    }

    displayResults(data) {
        if (!data.success) {
            this.resultsContent.innerHTML = `
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${data.error || 'Unable to analyze symptoms'}</p>
                </div>
            `;
            return;
        }

        const analysis = data.analysis;
        let html = '';

        // Urgency badge
        const urgencyClass = this.getUrgencyClass(analysis.urgency);
        html += `
            <div class="urgency-section">
                <h3>Recommended Action</h3>
                <div class="urgency-badge ${urgencyClass}">
                    ${analysis.urgency}
                </div>
            </div>
        `;

        // Conditions
        html += `<h3>Possible Conditions</h3>`;
        
        if (analysis.conditions && analysis.conditions.length > 0) {
            analysis.conditions.forEach(condition => {
                html += `
                    <div class="condition-card">
                        <div class="condition-name">${condition.name}</div>
                        ${condition.confidence ? `<div class="condition-confidence">Confidence: ${condition.confidence}</div>` : ''}
                        ${condition.description ? `<div class="condition-desc">${condition.description}</div>` : ''}
                        
                        ${condition.recommendations && condition.recommendations.length > 0 ? `
                            <h4>Recommendations:</h4>
                            <ul class="recommendations">
                                ${condition.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `;
            });
        }

        // Immediate attention
        if (analysis.immediateAttention && analysis.immediateAttention.length > 0) {
            html += `
                <div class="attention-section">
                    <h3>Seek Immediate Medical Attention If:</h3>
                    <ul class="recommendations">
                        ${analysis.immediateAttention.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        this.resultsContent.innerHTML = html;
    }

    getUrgencyClass(urgency) {
        const urgencyLower = urgency.toLowerCase();
        if (urgencyLower.includes('emergency')) return 'urgency-emergency';
        if (urgencyLower.includes('urgent')) return 'urgency-urgent';
        if (urgencyLower.includes('primary')) return 'urgency-primary';
        return 'urgency-self';
    }

    resetForm() {
        this.form.reset();
        this.updateCharCount();
        this.resultsSection.style.display = 'none';
        this.inputSection.style.display = 'block';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MediScanApp();
});
