class ReportManager {
    constructor() {
        this.reportChart = null;
        this.selectedMonth = null;
        this.selectedYear = null;
        this.reportData = {
            income: [],
            expenses: []
        };
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Set default month to current month
        const reportMonth = document.getElementById('reportMonth');
        if (reportMonth) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            reportMonth.value = `${year}-${month}`;
            
            reportMonth.addEventListener('change', () => {
                this.hideReportPreview();
            });
        }

        // Generate report button
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // Download buttons
        const pdfBtn = document.getElementById('downloadPdfBtn');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => {
                this.downloadPDF();
            });
        }

        const csvBtn = document.getElementById('downloadCsvBtn');
        if (csvBtn) {
            csvBtn.addEventListener('click', () => {
                this.downloadCSV();
            });
        }
    }

    generateReport() {
        const monthInput = document.getElementById('reportMonth').value;
        if (!monthInput) return;

        const [year, month] = monthInput.split('-');
        this.selectedYear = parseInt(year);
        this.selectedMonth = parseInt(month) - 1; // JavaScript months are 0-based

        // Get transactions for selected month
        this.fetchMonthData();
        
        // Update report period
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('reportPeriod').textContent = `${monthNames[this.selectedMonth]} ${this.selectedYear}`;
        
        // Update summary
        const totalIncome = this.reportData.income.reduce((sum, inc) => sum + inc.amount, 0);
        const totalExpenses = this.reportData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const balance = totalIncome - totalExpenses;
        
        document.getElementById('reportIncome').textContent = `$${totalIncome.toFixed(2)}`;
        document.getElementById('reportExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('reportBalance').textContent = `$${balance.toFixed(2)}`;
        
        // Generate expense chart
        this.generateExpenseChart();
        
        // Generate transaction tables
        this.generateTransactionTables();
        
        // Show report preview
        this.showReportPreview();
    }

    fetchMonthData() {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const income = JSON.parse(localStorage.getItem('income')) || [];
        
        // Filter transactions for selected month
        this.reportData.expenses = expenses.filter(exp => {
            const expDate = new Date(exp.date + 'T00:00:00');
            return expDate.getFullYear() === this.selectedYear && 
                   expDate.getMonth() === this.selectedMonth;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        this.reportData.income = income.filter(inc => {
            const incDate = new Date(inc.date + 'T00:00:00');
            return incDate.getFullYear() === this.selectedYear && 
                   incDate.getMonth() === this.selectedMonth;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    generateExpenseChart() {
        const ctx = document.getElementById('reportExpenseChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.reportChart) {
            this.reportChart.destroy();
        }
        
        // Calculate category totals
        const categoryTotals = this.reportData.expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});
        
        // Create new chart
        this.reportChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: [
                        '#0B6E4F', // Primary alpine green
                        '#14A76C', // Lighter alpine green
                        '#3E885B', // Complementary green
                        '#0A5C42', // Darker alpine green
                        '#45B7D1', // Complementary blue
                        '#2C8C99', // Darker blue
                        '#48BF84', // Another green shade
                        '#439775'  // Yet another green shade
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }

    generateTransactionTables() {
        // Income transactions
        const incomeTable = document.getElementById('incomeTransactions');
        incomeTable.innerHTML = '';
        
        if (this.reportData.income.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3">No income transactions for this period</td>';
            incomeTable.appendChild(row);
        } else {
            this.reportData.income.forEach(inc => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(inc.date)}</td>
                    <td>$${inc.amount.toFixed(2)}</td>
                    <td>${inc.source}</td>
                `;
                incomeTable.appendChild(row);
            });
        }
        
        // Expense transactions
        const expenseTable = document.getElementById('expenseTransactions');
        expenseTable.innerHTML = '';
        
        if (this.reportData.expenses.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4">No expense transactions for this period</td>';
            expenseTable.appendChild(row);
        } else {
            this.reportData.expenses.forEach(exp => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(exp.date)}</td>
                    <td>$${exp.amount.toFixed(2)}</td>
                    <td>${exp.category}</td>
                    <td>${exp.note || ''}</td>
                `;
                expenseTable.appendChild(row);
            });
        }
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    showReportPreview() {
        document.getElementById('reportPreview').classList.remove('hidden');
    }

    hideReportPreview() {
        document.getElementById('reportPreview').classList.add('hidden');
    }

    downloadPDF() {
        // Include the jsPDF and html2canvas libraries
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => {
            this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', () => {
                const { jsPDF } = window.jspdf;
                const reportContent = document.getElementById('reportContent');
                
                // Create a loading message
                const loadingMsg = document.createElement('div');
                loadingMsg.classList.add('message');
                loadingMsg.textContent = 'Generating PDF...';
                loadingMsg.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px;
                    border-radius: 8px;
                    background-color: var(--primary-color);
                    color: white;
                    z-index: 1000;
                `;
                document.body.appendChild(loadingMsg);

                // First, ensure the report content is visible for html2canvas
                const wasHidden = reportContent.closest('.hidden');
                if (wasHidden) {
                    reportContent.closest('.hidden').classList.remove('hidden');
                }

                setTimeout(() => {
                    html2canvas(reportContent, {
                        scale: 2,
                        logging: false,
                        useCORS: true
                    }).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: 'a4'
                        });
                        
                        const imgWidth = 210; // A4 width in mm
                        const pageHeight = 297; // A4 height in mm
                        const imgHeight = canvas.height * imgWidth / canvas.width;
                        let heightLeft = imgHeight;
                        let position = 0;
                        
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                        
                        while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            pdf.addPage();
                            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                        }
                        
                        // Generate file name with month and year
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                           'July', 'August', 'September', 'October', 'November', 'December'];
                        const fileName = `Financial_Report_${monthNames[this.selectedMonth]}_${this.selectedYear}.pdf`;
                        
                        pdf.save(fileName);
                        
                        // Remove loading message
                        loadingMsg.remove();
                        
                        // Show success message
                        this.showSuccessMessage('PDF downloaded successfully!');
                        
                        // Restore hidden state if needed
                        if (wasHidden) {
                            reportContent.closest('.section').classList.add('hidden');
                        }
                    });
                }, 500); // Small delay to ensure the DOM has updated
            });
        });
    }

    downloadCSV() {
        // Prepare CSV content
        let csvContent = 'data:text/csv;charset=utf-8,';
        
        // Add header
        csvContent += `Financial Report - ${document.getElementById('reportPeriod').textContent}\r\n\r\n`;
        
        // Add summary
        csvContent += 'Summary\r\n';
        csvContent += `Total Income,${document.getElementById('reportIncome').textContent}\r\n`;
        csvContent += `Total Expenses,${document.getElementById('reportExpenses').textContent}\r\n`;
        csvContent += `Balance,${document.getElementById('reportBalance').textContent}\r\n\r\n`;
        
        // Add income transactions
        csvContent += 'Income Transactions\r\n';
        csvContent += 'Date,Amount,Source\r\n';
        
        if (this.reportData.income.length === 0) {
            csvContent += 'No income transactions for this period\r\n';
        } else {
            this.reportData.income.forEach(inc => {
                csvContent += `${this.formatDate(inc.date)},$${inc.amount.toFixed(2)},${inc.source}\r\n`;
            });
        }
        
        csvContent += '\r\n';
        
        // Add expense transactions
        csvContent += 'Expense Transactions\r\n';
        csvContent += 'Date,Amount,Category,Note\r\n';
        
        if (this.reportData.expenses.length === 0) {
            csvContent += 'No expense transactions for this period\r\n';
        } else {
            this.reportData.expenses.forEach(exp => {
                csvContent += `${this.formatDate(exp.date)},$${exp.amount.toFixed(2)},${exp.category},${exp.note || ''}\r\n`;
            });
        }
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        
        // Generate file name with month and year
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const fileName = `Financial_Report_${monthNames[this.selectedMonth]}_${this.selectedYear}.csv`;
        
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        
        // Show success message
        this.showSuccessMessage('CSV downloaded successfully!');
    }

    loadScript(url, callback) {
        // Check if the script already exists
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            callback();
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }

    showSuccessMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message success';
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            background-color: var(--primary-color);
            color: white;
        `;
        messageElement.textContent = message;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            margin-left: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        `;
        messageElement.appendChild(closeBtn);

        // Add to document
        document.body.appendChild(messageElement);

        // Remove after 5 seconds or on click
        closeBtn.onclick = () => messageElement.remove();
        setTimeout(() => messageElement.remove(), 5000);
    }
}

// Initialize the report manager
window.reportManager = new ReportManager(); 