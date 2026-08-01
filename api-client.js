(() => {
  'use strict';

  const ENDPOINT_KEY = 'portal_api_endpoint_v1';
  const TOKEN_KEY = 'portal_api_token_v1';

  class PortalApiClient {
    constructor() {
      this.endpoint = localStorage.getItem(ENDPOINT_KEY) || '';
      this.token = sessionStorage.getItem(TOKEN_KEY) || '';
    }

    configure(endpoint) {
      const normalized = String(endpoint || '').trim();
      if (normalized && !/^https:\/\/script\.google\.com\/macros\/s\//.test(normalized)) {
        throw new Error('Informe uma URL válida do Google Apps Script.');
      }
      this.endpoint = normalized;
      if (normalized) localStorage.setItem(ENDPOINT_KEY, normalized);
      else localStorage.removeItem(ENDPOINT_KEY);
      return this.endpoint;
    }

    isConfigured() {
      return Boolean(this.endpoint);
    }

    isAuthenticated() {
      return Boolean(this.token);
    }

    async health() {
      this.assertConfigured();
      const response = await fetch(`${this.endpoint}?action=health`, {
        method: 'GET',
        redirect: 'follow'
      });
      return this.parseResponse(response);
    }

    async login(username, password) {
      const data = await this.request('login', { username, password }, false);
      this.token = data.token;
      sessionStorage.setItem(TOKEN_KEY, this.token);
      return data;
    }

    async logout() {
      try {
        if (this.token) await this.request('logout', {});
      } finally {
        this.token = '';
        sessionStorage.removeItem(TOKEN_KEY);
      }
    }

    bootstrap() {
      return this.request('bootstrap');
    }

    dashboard(filters = {}) {
      return this.request('dashboard', filters);
    }

    listAttendance(date, classId) {
      return this.request('listAttendance', { date, classId });
    }

    saveAttendance(date, classId, entries) {
      return this.request('saveAttendance', { date, classId, entries });
    }

    attendanceSummary(filters = {}) {
      return this.request('attendanceSummary', filters);
    }

    async request(action, payload = {}, authenticated = true) {
      this.assertConfigured();
      if (authenticated && !this.token) {
        throw new Error('Sessão não iniciada.');
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action,
          token: authenticated ? this.token : '',
          payload
        })
      });

      return this.parseResponse(response);
    }

    async parseResponse(response) {
      if (!response.ok) {
        throw new Error(`Falha de comunicação com o servidor (${response.status}).`);
      }
      const body = await response.json();
      if (!body.ok) {
        if (/sessão inválida|expirada/i.test(body.error || '')) {
          this.token = '';
          sessionStorage.removeItem(TOKEN_KEY);
        }
        throw new Error(body.error || 'O servidor não conseguiu concluir a operação.');
      }
      return body.data;
    }

    assertConfigured() {
      if (!this.endpoint) {
        throw new Error('A URL da API ainda não foi configurada.');
      }
    }
  }

  window.PortalAPI = new PortalApiClient();
})();
