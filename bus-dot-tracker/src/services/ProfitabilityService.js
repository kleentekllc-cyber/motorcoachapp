/**
 * ProfitabilityService
 * Handles all profitability-related API calls
 */
class ProfitabilityService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/profitability';
  }

  /**
   * Get trip profit details
   */
  async getTripProfit(tripId) {
    const response = await fetch(`${this.baseURL}/trips/${tripId}/profit`);
    if (!response.ok) throw new Error('Failed to fetch trip profit');
    return response.json();
  }

  /**
   * Get trip margin
   */
  async getTripMargin(tripId) {
    const response = await fetch(`${this.baseURL}/trips/${tripId}/margin`);
    if (!response.ok) throw new Error('Failed to fetch trip margin');
    return response.json();
  }

  /**
   * Calculate and update trip profitability
   */
  async calculateTripProfitability(tripId) {
    const response = await fetch(`${this.baseURL}/trips/${tripId}/calculate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to calculate trip profitability');
    return response.json();
  }

  /**
   * Get all customers profitability
   */
  async getAllCustomersProfitability(startDate = null, endDate = null) {
    let url = `${this.baseURL}/customers`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch customers profitability');
    return response.json();
  }

  /**
   * Get customer profitability
   */
  async getCustomerProfitability(customerName, startDate = null, endDate = null) {
    let url = `${this.baseURL}/customers/${encodeURIComponent(customerName)}`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch customer profitability');
    return response.json();
  }

  /**
   * Get all routes profitability
   */
  async getAllRoutesProfitability(startDate = null, endDate = null) {
    let url = `${this.baseURL}/routes`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch routes profitability');
    return response.json();
  }

  /**
   * Get route profitability
   */
  async getRouteProfitability(routeName, startDate = null, endDate = null) {
    let url = `${this.baseURL}/routes/${encodeURIComponent(routeName)}`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch route profitability');
    return response.json();
  }

  /**
   * Get fleet profitability dashboard
   */
  async getFleetProfitability(startDate = null, endDate = null) {
    let url = `${this.baseURL}/fleet`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch fleet profitability');
    return response.json();
  }

  /**
   * Bulk calculate profitability for all trips
   */
  async bulkCalculateProfitability(startDate = null, endDate = null) {
    let url = `${this.baseURL}/bulk-calculate`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to bulk calculate profitability');
    return response.json();
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Format percentage
   */
  formatPercentage(decimal) {
    return `${(decimal * 100).toFixed(2)}%`;
  }

  /**
   * Get margin color class based on margin value
   */
  getMarginColorClass(margin) {
    if (margin >= 0.3) return 'profit-excellent';
    if (margin >= 0.15) return 'profit-good';
    if (margin >= 0.05) return 'profit-fair';
    if (margin >= 0) return 'profit-poor';
    return 'profit-loss';
  }
}

export default ProfitabilityService;
