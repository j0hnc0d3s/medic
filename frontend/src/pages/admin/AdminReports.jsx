import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { Bar, Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import jsPDF from 'jspdf'

import '../styles/Reports.css'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function Reports() {
  const [activeTab, setActiveTab] = useState('patients')
  const [reportType, setReportType] = useState('custom')  // ✅ ADD THIS LINE!
  const [dateRange, setDateRange] = useState({
    start: getWeekStart(new Date()).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(d.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const generateReport = async () => {
    setLoading(true)
    
    try {
      if (activeTab === 'patients') {
        await generatePatientReport()
      } else {
        await generateFinancialReport()
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    }
    
    setLoading(false)
  }

  const generatePatientReport = async () => {
    const startDate = Timestamp.fromDate(new Date(dateRange.start))
    const endDate = Timestamp.fromDate(new Date(dateRange.end))

    // Get all patients
    const patientsSnapshot = await getDocs(collection(db, 'patients'))
    const patients = patientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Count visits per day
    const visitsByDay = {}
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    patients.forEach(patient => {
      if (patient.visits) {
        patient.visits.forEach(visit => {
          const visitDate = visit.date.toDate()
          if (visitDate >= startDate.toDate() && visitDate <= endDate.toDate()) {
            const dayKey = visitDate.toLocaleDateString()
            visitsByDay[dayKey] = (visitsByDay[dayKey] || 0) + 1
          }
        })
      }
    })

    const totalPatients = Object.values(visitsByDay).reduce((sum, count) => sum + count, 0)

    setReportData({
      totalPatients,
      visitsByDay,
      dateRange
    })
  }

  const generateFinancialReport = async () => {
    const startDate = Timestamp.fromDate(new Date(dateRange.start))
    const endDate = Timestamp.fromDate(new Date(dateRange.end))

    // Get income
    const incomeSnapshot = await getDocs(collection(db, 'income'))
    const income = incomeSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => {
        const date = item.date.toDate()
        return date >= startDate.toDate() && date <= endDate.toDate()
      })

    // Get expenses
    const expenseSnapshot = await getDocs(collection(db, 'expenditure'))
    const expenses = expenseSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => {
        const date = item.date.toDate()
        return date >= startDate.toDate() && date <= endDate.toDate()
      })

    // Calculate totals
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)

    // Group by category
    const incomeByCategory = {}
    income.forEach(item => {
      incomeByCategory[item.category] = (incomeByCategory[item.category] || 0) + item.amount
    })

    const expensesByCategory = {}
    expenses.forEach(item => {
      expensesByCategory[item.category] = (expensesByCategory[item.category] || 0) + item.amount
    })

    setReportData({
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      incomeByCategory,
      expensesByCategory,
      income,
      expenses,
      dateRange
    })
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(31, 71, 136)
    doc.text('Medic Clinic', 20, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(`${activeTab === 'patients' ? 'Weekly Patient Report' : 'Financial Report'}`, 20, 28)
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 20, 34)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40)

    if (activeTab === 'patients' && reportData) {
      doc.setFontSize(16)
      doc.setTextColor(17, 24, 39)
      doc.text('Patient Summary', 20, 55)
      
      doc.setFontSize(12)
      doc.setTextColor(55, 65, 81)
      doc.text(`Total Patients Seen: ${reportData.totalPatients}`, 20, 70)
      
      // Add daily breakdown
      let yPos = 85
      doc.text('Daily Breakdown:', 20, yPos)
      yPos += 10
      
      Object.entries(reportData.visitsByDay).forEach(([date, count]) => {
        doc.text(`${date}: ${count} patients`, 30, yPos)
        yPos += 8
      })
    } else if (reportData) {
      doc.setFontSize(16)
      doc.setTextColor(17, 24, 39)
      doc.text('Financial Summary', 20, 55)
      
      doc.setFontSize(12)
      doc.setTextColor(55, 65, 81)
      doc.text(`Total Income: $${reportData.totalIncome.toFixed(2)}`, 20, 70)
      doc.text(`Total Expenses: $${reportData.totalExpenses.toFixed(2)}`, 20, 80)
      doc.text(`Net Profit: $${reportData.netProfit.toFixed(2)}`, 20, 90)
    }

    doc.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportCSV = () => {
    if (activeTab === 'patients' && reportData) {
      const headers = ['Date', 'Patients']
      const rows = Object.entries(reportData.visitsByDay).map(([date, count]) => [date, count])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      downloadCSV(csvContent, 'patient_report')
    } else if (reportData) {
      const headers = ['Type', 'Category', 'Amount']
      const incomeRows = Object.entries(reportData.incomeByCategory).map(([cat, amt]) => 
        ['Income', cat, amt.toFixed(2)]
      )
      const expenseRows = Object.entries(reportData.expensesByCategory).map(([cat, amt]) => 
        ['Expense', cat, amt.toFixed(2)]
      )
      
      const csvContent = [
        headers.join(','),
        ...incomeRows.map(row => row.join(',')),
        ...expenseRows.map(row => row.join(','))
      ].join('\n')
      
      downloadCSV(csvContent, 'financial_report')
    }
  }

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const setQuickDateRange = (type) => {
    const today = new Date()
    let start, end

    switch (type) {
      case 'week':
        start = getWeekStart(today)
        end = today
        break
      case 'month':
        start = getMonthStart(today)
        end = today
        break
      case 'year':
        start = new Date(today.getFullYear(), 0, 1)
        end = today
        break
      default:
        return
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    })
  }

  // Chart configurations
  const patientChartData = reportData ? {
    labels: Object.keys(reportData.visitsByDay),
    datasets: [{
      label: 'Patients',
      data: Object.values(reportData.visitsByDay),
      backgroundColor: '#1F4788',
      borderRadius: 6
    }]
  } : null

  const incomePieData = reportData ? {
    labels: Object.keys(reportData.incomeByCategory),
    datasets: [{
      data: Object.values(reportData.incomeByCategory),
      backgroundColor: ['#1F4788', '#2D9C9C', '#6B7280', '#9CA3AF']
    }]
  } : null

  const expensePieData = reportData ? {
    labels: Object.keys(reportData.expensesByCategory),
    datasets: [{
      data: Object.values(reportData.expensesByCategory),
      backgroundColor: ['#1F4788', '#2D9C9C', '#F59E0B', '#8B5CF6', '#6B7280']
    }]
  } : null

  return (
    <div className="reports">
      <div className="report">
        <header className="reports-header">
          <h1 className="reports-title">Reports</h1>

          {reportData && (
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={exportCSV}>
                Export CSV
              </button>

              <button className="btn btn-primary" onClick={exportPDF}>
                Download PDF
              </button>

              <button className="btn btn-primary" onClick={generateReport}>
                Generate Report
              </button>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('patients')
              setReportData(null)
            }}
          >
            Weekly Patients
          </button>

          <button 
            className={`tab ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('financial')
              setReportData(null)
            }}
          >
            Financial Report
          </button>
        </div>

        {/* Filters */}
        <div className="report-filter-row">
          <div className="filter-group report-type">
            <label>Report Type</label>

            <select 
              className="filter-select"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="custom">Custom Date Range</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        
          <div className="filter-group date-field">
            <label>Week Starting</label>

            <input
              type="date"
              className="filter-date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
        
          <div className="filter-group date-field">
            <label>Week Ending</label>

            <input
              type="date"
              className="filter-date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        {/* Report Display */}
        {reportData ? (
          <div className="report-content">
            {activeTab === 'patients' ? (
              <>
                <div className="summary-card">
                  <h3>Total Patients</h3>
                  <div className="summary-number">{reportData.totalPatients}</div>
                  <div className="summary-date">
                    {dateRange.start} to {dateRange.end}
                  </div>
                </div>

                {patientChartData && (
                  <div className="chart-card">
                    <h3>Daily Breakdown</h3>
                    <Bar data={patientChartData} options={{ responsive: true, maintainAspectRatio: true }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="finance-summary-grid">
                  <div className="summary-card income">
                    <h3>Total Income</h3>
                    <div className="summary-number">${reportData.totalIncome.toFixed(2)}</div>
                  </div>
                  <div className="summary-card expense">
                    <h3>Total Expenses</h3>
                    <div className="summary-number">${reportData.totalExpenses.toFixed(2)}</div>
                  </div>
                  <div className={`summary-card ${reportData.netProfit >= 0 ? 'profit' : 'loss'}`}>
                    <h3>Net {reportData.netProfit >= 0 ? 'Profit' : 'Loss'}</h3>
                    <div className="summary-number">${Math.abs(reportData.netProfit).toFixed(2)}</div>
                  </div>
                </div>

                <div className="charts-grid">
                  {incomePieData && (
                    <div className="chart-card">
                      <h3>Income by Category</h3>
                      <Pie data={incomePieData} />
                    </div>
                  )}
                  {expensePieData && (
                    <div className="chart-card">
                      <h3>Expenses by Category</h3>
                      <Pie data={expensePieData} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">Select date range and generate report</div>
          </div>
        )}
      </div>
    </div>
  )
}