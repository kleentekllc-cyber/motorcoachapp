import ProfitabilityService from '../services/ProfitabilityService.js';

/**
 * ProfitabilityController
 * Manages the Profitability Dashboard UI and interactions
 */
class ProfitabilityController {
  constructor() {
    this.service = new ProfitabilityService();
    this.currentView = 'fleet'; // fleet, customers, routes
  }

  /**
   * Initialize the profitability dashboard
   */
  async init() {
    this.attachEventListeners();
    await this.loadFleetProfitability();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // View switcher
    document.querySelectorAll('.profit-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
    });

    // Date range filter
    document.getElementById('profitDateRangeBtn')?.addEventListener('click', () => {
      this.applyDateFilter();
    });

    // Bulk calculate button
    document.getElementById('bulkCalculateBtn')?.addEventListener('click', () => {
      this.bulkCalculate();
    });
  }

  /**
   * Switch between different profitability views
   */
  async switchView(view) {
    this.currentView = view;
    
    // Update active button
    document.querySelectorAll('.profit-view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Load appropriate data
    switch (view) {
      case 'fleet':
        await this.loadFleetProfitability();
        break;
      case 'customers':
        await this.loadCustomersProfitability();
        break;
      case 'routes':
        await this.loadRoutesProfitability();
        break;
    }
  }

  /**
   * Load fleet profitability dashboard
   */
  async loadFleetProfitability() {
    try {
      const { startDate, endDate } = this.getDateRange();
      const data = await this.service.getFleetProfitability(startDate, endDate);
      this.renderFleetDashboard(data);
    } catch (error) {
      console.error('Error loading fleet profitability:', error);
      this.showError('Failed to load fleet profitability data');
    }
  }

  /**
   * Render fleet profitability dashboard
   */
  renderFleetDashboard(data) {
    const container = document.getElementById('profitabilityContent');
    if (!container) return;

    const html = `
      <div class="profit-dashboard">
        <div class="profit-kpis">
          <div class="profit-kpi-card">
            <h3>Total Revenue</h3>
            <div class="kpi-value">${this.service.formatCurrency(data.totalRevenue)}</div>
            <div class="kpi-subtitle">${data.tripCount} trips</div>
          </div>
          
          <div class="profit-kpi-card">
            <h3>Total Cost</h3>
            <div class="kpi-value">${this.service.formatCurrency(data.totalCost)}</div>
            <div class="kpi-subtitle">Operating expenses</div>
          </div>
          
          <div class="profit-kpi-card">
            <h3>Total Profit</h3>
            <div class="kpi-value ${data.totalProfit >= 0 ? 'positive' : 'negative'}">
              ${this.service.formatCurrency(data.totalProfit)}
            </div>
            <div class="kpi-subtitle">Net profit</div>
          </div>
          
          <div class="profit-kpi-card highlight">
            <h3>Fleet Margin</h3>
            <div class="kpi-value ${this.service.getMarginColorClass(data.fleetMargin)}">
              ${this.service.formatPercentage(data.fleetMargin)}
            </div>
            <div class="kpi-subtitle">Profit margin</div>
          </div>
        </div>

        <div class="profit-averages">
          <h3>Per-Trip Averages</h3>
          <div class="profit-avg-grid">
            <div class="profit-avg-item">
              <span class="label">Avg Revenue:</span>
              <span class="value">${this.service.formatCurrency(data.avgRevenuePerTrip)}</span>
            </div>
            <div class="profit-avg-item">
              <span class="label">Avg Cost:</span>
              <span class="value">${this.service.formatCurrency(data.avgCostPerTrip)}</span>
            </div>
            <div class="profit-avg-item">
              <span class="label">Avg Profit:</span>
              <span class="value">${this.service.formatCurrency(data.avgProfitPerTrip)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Load customers profitability
   */
  async loadCustomersProfitability() {
    try {
      const { startDate, endDate } = this.getDateRange();
      const data = await this.service.getAllCustomersProfitability(startDate, endDate);
      this.renderCustomersTable(data);
    } catch (error) {
      console.error('Error loading customers profitability:', error);
      this.showError('Failed to load customers profitability data');
    }
  }

  /**
   * Render customers profitability table
   */
  renderCustomersTable(data) {
    const container = document.getElementById('profitabilityContent');
    if (!container) return;

    const rows = data.map(customer => `
      <tr>
        <td><strong>${customer.customerName}</strong></td>
        <td>${this.service.formatCurrency(customer.totalRevenue)}</td>
        <td>${this.service.formatCurrency(customer.totalCost)}</td>
        <td class="${customer.totalProfit >= 0 ? 'positive' : 'negative'}">
          ${this.service.formatCurrency(customer.totalProfit)}
        </td>
        <td class="${this.service.getMarginColorClass(customer.averageMargin)}">
          ${this.service.formatPercentage(customer.averageMargin)}
        </td>
        <td>${customer.tripCount}</td>
        <td>${this.service.formatCurrency(customer.lifetimeValue)}</td>
      </tr>
    `).join('');

    const html = `
      <div class="profit-table-container">
        <h3>Customer Profitability</h3>
        <table class="profit-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>Margin</th>
              <th>Trips</th>
              <th>LTV</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">No customer data available</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Load routes profitability
   */
  async loadRoutesProfitability() {
    try {
      const { startDate, endDate } = this.getDateRange();
      const data = await this.service.getAllRoutesProfitability(startDate, endDate);
      this.renderRoutesTable(data);
    } catch (error) {
      console.error('Error loading routes profitability:', error);
      this.showError('Failed to load routes profitability data');
    }
  }

  /**
   * Render routes profitability table
   */
  renderRoutesTable(data) {
    const container = document.getElementById('profitabilityContent');
    if (!container) return;

    const rows = data.map(route => `
      <tr>
        <td><strong>${route.routeName}</strong></td>
        <td>${this.service.formatCurrency(route.totalRevenue)}</td>
        <td>${this.service.formatCurrency(route.totalCost)}</td>
        <td class="${route.totalProfit >= 0 ? 'positive' : 'negative'}">
          ${this.service.formatCurrency(route.totalProfit)}
        </td>
        <td class="${this.service.getMarginColorClass(route.averageMargin)}">
          ${this.service.formatPercentage(route.averageMargin)}
        </td>
        <td>${route.tripCount}</td>
        <td>${route.efficiency.toFixed(2)}x</td>
      </tr>
    `).join('');

    const html = `
      <div class="profit-table-container">
        <h3>Route Profitability</h3>
        <table class="profit-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>Margin</th>
              <th>Trips</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">No route data available</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Get date range from filters
   */
  getDateRange() {
    const startDateInput = document.getElementById('profitStartDate');
    const endDateInput = document.getElementById('profitEndDate');
    
    return {
      startDate: startDateInput?.value || null,
      endDate: endDateInput?.value || null,
    };
  }

  /**
   * Apply date filter
   */
  async applyDateFilter() {
    await this.switchView(this.currentView);
  }

  /**
   * Bulk calculate profitability
   */
  async bulkCalculate() {
    if (!confirm('This will recalculate profitability for all trips. Continue?')) {
      return;
    }

    try {
      const { startDate, endDate } = this.getDateRange();
      const result = await this.service.bulkCalculateProfitability(startDate, endDate);
      alert(`Successfully updated ${result.updated} trips`);
      await this.switchView(this.currentView);
    } catch (error) {
      console.error('Error bulk calculating:', error);
      this.showError('Failed to bulk calculate profitability');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    alert(message);
  }
}

export default ProfitabilityController;
