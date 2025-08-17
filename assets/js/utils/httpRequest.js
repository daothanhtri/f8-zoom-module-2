class HttpRequest {
  constructor(baseUrl) {
    this.baseUrl = "https://spotify.f8team.dev/api/";
  }

  _getAccessToken() {
    return localStorage.getItem("access_token");
  }

  async _send(path, method, data = null, options = {}) {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      const accessToken = this._getAccessToken();
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const _options = {
        ...options,
        method,
        headers,
      };

      if (data) {
        if (options.isFormData) {
          delete _options.headers["Content-Type"];
          _options.body = data;
        } else {
          _options.body = JSON.stringify(data);
        }
      } else {
        if (
          ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
          !options.isFormData
        ) {
          _options.body = undefined;
        }
      }

      const res = await fetch(`${this.baseUrl}${path}`, _options);

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorData = {};
        if (contentType && contentType.includes("application/json")) {
          errorData = await res.json().catch(() => ({}));
        }
        const message = errorData.message || res.statusText || "Unknown error";
        const error = new Error(`HTTP error: ${res.status} - ${message}`);
        error.status = res.status;
        error.data = errorData;
        throw error;
      }

      if (res.status === 204) {
        return null;
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const response = await res.json();
        return response;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Request to ${path} failed:`, error);
      throw error;
    }
  }

  async get(path, options) {
    return await this._send(path, "GET", null, options);
  }

  async post(path, data, options) {
    return await this._send(path, "POST", data, options);
  }

  async put(path, data, options) {
    return await this._send(path, "PUT", data, options);
  }

  async patch(path, data, options) {
    return await this._send(path, "PATCH", data, options);
  }

  async del(path, options) {
    return await this._send(path, "DELETE", null, options);
  }
}

const httpRequest = new HttpRequest();
export default httpRequest;
