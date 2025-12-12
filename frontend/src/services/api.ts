import axios from 'axios';
import { AxiosInstance } from 'axios';

import {
  Book,
  Page,
  PageDetails,
  BookDetailsResponse,
  NextPageNumberResponse,
  BatchRequest,
  BatchResult,
  Request,
  Category,
  OCRResponse,
  TranslationResponse} from "../types";
import {  
  UserCreate,
  UserUpdate,
  UserSummary } from "../types/user_interfaces";
  
import { UserPermissions } from '../auth/RoleGuard';

import {
  Tenant,
  TenantSummary,
  TenantBrandingConfig,
  TenantCreate,
  TenantUpdate,
  TenantSettings
} from "../types/tenant_interfaces";


const API_URL = import.meta.env.VITE_API_URL;
class ApiService {
  private axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
      'X-Tenant-Slug': 'root', // Default tenant for simplified routing
    },
  });

  get axiosClient(): AxiosInstance {
    return this.axiosInstance;
  }

  private async handleResponse<T>(response: any): Promise<T> {
    if (response.status < 200 || response.status >= 300) {
      const errorData = response.data || { detail: "Unknown error" };
      console.log("API Error:", errorData.detail);
      throw new Error(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }
    return response.data;
  }

  // Book operations
  async getAllBooks(): Promise<Book[]> {
    const response = await this.axiosInstance.get(`/book/`);
    return this.handleResponse<Book[]>(response);
  }

  async getBook(bookId: string): Promise<Book> {
    const response = await this.axiosInstance.get(`/book/${bookId}`);
    return this.handleResponse<Book>(response);
  }

  async getBookDetails(bookId: string): Promise<BookDetailsResponse> {
    const response = await this.axiosInstance.get(`/book/details/${bookId}`);
    return this.handleResponse<BookDetailsResponse>(response);
  }

  async createBook(formData: FormData): Promise<Book> {
    const response = await this.axiosInstance.post(`/book/`, formData);
    return this.handleResponse<Book>(response);
  }

  async updateBook(bookId: string, formData: FormData): Promise<Book> {
    const response = await this.axiosInstance.put(`/book/${bookId}`, formData);
    return this.handleResponse<Book>(response);
  }

  async deleteBook(bookId: string, passwordHash: string): Promise<void> {
    const response = await this.axiosInstance.delete(`/book/${bookId}`, {
      data: { password: passwordHash },
    });
    this.handleResponse<void>(response);
  }

  async getNextPageNumber(bookId: string): Promise<NextPageNumberResponse> {
    const response = await this.axiosInstance.get(`/book/${bookId}/next-page-number`);
    return this.handleResponse<NextPageNumberResponse>(response);
  }

  // Page operations
  async getPage(pageId: string): Promise<PageDetails> {
    const response = await this.axiosInstance.get(`/page/${pageId}`);
    return this.handleResponse<PageDetails>(response);
  }

  async createPage(formData: FormData): Promise<Page> {
    const response = await this.axiosInstance.post(`/page/`, formData);
    return this.handleResponse<Page>(response);
  }

  async updatePage(pageId: string, formData: FormData): Promise<PageDetails> {
    const response = await this.axiosInstance.put(`/page/${pageId}`, formData);
    return this.handleResponse<PageDetails>(response);
  }

  async deletePage(pageId: string): Promise<void> {
    const response = await this.axiosInstance.delete(`/page/${pageId}`);
    this.handleResponse<void>(response);
  }

  getImageProxyUrl(imageUrl: string): string {
    return `${API_URL.replace(/\/$/, '')}/pdf-create/?url=${encodeURIComponent(imageUrl)}`;
  }

  // Tenant Operations
  tenantEndpoint = '/tenant';

  /**
   * API call to validate tenant from slug by simply calling this.
   * @returns Tenant's branding configuration.
   */
  async validateTenant(): Promise<TenantBrandingConfig> {
    const response = await this.axiosInstance.get(`${this.tenantEndpoint}/validate`);
    return this.handleResponse<TenantBrandingConfig>(response);
  }
  
  async getAllTenants(): Promise<TenantSummary[]> {
    const response = await this.axiosInstance.get(`${this.tenantEndpoint}/`);
    return this.handleResponse<TenantSummary[]>(response);
  }
  
  async getTenantInfo(tenantId: string): Promise<Tenant> {
    const response = await this.axiosInstance.get(`${this.tenantEndpoint}/${tenantId}`);
    return this.handleResponse<Tenant>(response);
  }  
  
  async createTenant(tenantData: TenantCreate): Promise<Tenant> {
    const response = await this.axiosInstance.post(`${this.tenantEndpoint}/`, tenantData);
    return this.handleResponse<Tenant>(response);
  }
  
  async deleteTenant(tenantId: string, tenantName: string): Promise<string> {    
    const response = await this.axiosInstance.delete(`${this.tenantEndpoint}/${tenantId}`, {
      params: { expected_tenant_name: tenantName },
    });
    return this.handleResponse<string>(response);
  }

  /**
   * Tenant update by SUPERADMIN like name, slug, plan, status, etc.
   */
  async updateTenant(tenantId: string, tenantData: TenantUpdate): Promise<Tenant> {
    const response = await this.axiosInstance.patch(`${this.tenantEndpoint}/${tenantId}`, tenantData);
    return this.handleResponse<Tenant>(response);
  }
  
  /**
   * Tenant customise by TENANT ADMIN like branding, permissions mapping, etc.
   */
  async updateTenantSettings(tenantData: TenantSettings): Promise<TenantSettings> {
    const response = await this.axiosInstance.patch(`${this.tenantEndpoint}/settings`, tenantData);
    return this.handleResponse<TenantSettings>(response);
  }

  async getTenantSettings(): Promise<TenantSettings> {
    const response = await this.axiosInstance.get(`${this.tenantEndpoint}/settings`);
    return this.handleResponse<TenantSettings>(response);
  }

  // OCR operations
  async performOCR(
    params: {
      pageId: string;
      photoUrl: string;
      language: string;
      aiModel: string;
      customPrompt?: string;
      autoSave?: boolean;
    },
    abortSignal?: AbortSignal
  ): Promise<OCRResponse> {
    const {
      pageId,
      photoUrl,
      language,
      aiModel,
      customPrompt = '',
      autoSave = false,
    } = params;

    const formData = new FormData();
    formData.append("page_id", pageId);
    formData.append("photo_url", photoUrl);
    formData.append("language", language);
    formData.append("ai_model", aiModel);
    formData.append("auto_save", String(autoSave));
    
    if (customPrompt) {
      formData.append("custom_prompt", customPrompt);
    }

    const response = await this.axiosInstance.post(`/ocr/`, formData, {
      signal: abortSignal,
    });
    
    return this.handleResponse<OCRResponse>(response);
  }

  // Translation operations
  async performTranslation(
    params: {
      pageId: string,
      text: string,
      sourceLang: string,
      targetLang: string,
      aiModel: string,
      customPrompt?: string,
      autoSave?: boolean,
    },
    abortSignal?: AbortSignal
  ): Promise<TranslationResponse> {
    const {
      pageId,
      text,
      sourceLang,
      targetLang,
      aiModel,
      customPrompt = '',
      autoSave = false,
    } = params;

    const formData = new FormData();
    formData.append("page_id", pageId);
    formData.append("text", text);
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);
    formData.append("ai_model", aiModel)
    formData.append("auto_save", String(autoSave));
    if (customPrompt) {
      formData.append("custom_prompt", customPrompt);
    }

    const response = await this.axiosInstance.post(`/translate/`, formData, {
      signal: abortSignal,
    });

    return this.handleResponse<TranslationResponse>(response);
  }

  // Batch OCR & Translation Operations
  async performBatchProcessing(
    batchRequest: BatchRequest
  ): Promise<BatchResult> {
    const response = await this.axiosInstance.post(`/batch/process`, batchRequest);
    return this.handleResponse<BatchResult>(response);
  }

  // Discover API methods  
  async getRandomPages(pageCount: number): Promise<any> {    
    const response = await this.axiosInstance.get(`/discover/random-pages?count=${encodeURIComponent(pageCount)}`);
    return this.handleResponse<any>(response);
  }

  async getTopicContent(topic: string): Promise<any> {
    const response = await this.axiosInstance.get(
      `/discover/topic/${encodeURIComponent(topic)}`
    );
    return this.handleResponse<any>(response);
  }

  async searchBooks(query: string): Promise<any> {
    const response = await this.axiosInstance.get(
      `/discover/search?q=${encodeURIComponent(query)}`
    );
    return this.handleResponse<any>(response);
  }

  // EditRequest operations
  async getAllRequests(): Promise<Request[]> {
    const response = await this.axiosInstance.get(`/requests/`);
    return this.handleResponse<Request[]>(response);
  }

  async createEditRequest(request: Request): Promise<any> {
    const response = await this.axiosInstance.post(`/requests/`, request);
    return this.handleResponse<Request>(response);
  }

  async updateRequest(
    id: string,
    update: { status?: string; review?: string; newText?: string }
  ): Promise<Request> {
    const response = await this.axiosInstance.put(`/requests/${id}`, update);
    return this.handleResponse<Request>(response);
  }

  async updatePageByRequest(
    pageId: string,
    requestType: "ocr" | "translation",
    newText: string
  ): Promise<any> {
    const response = await this.axiosInstance.put(`/page/request/${pageId}`, { requestType, newText });
    return this.handleResponse<any>(response);
  }

  // Categories operations
  async getAllCategories(): Promise<Category[]> {
    const response = await this.axiosInstance.get(`/category/`);
    return this.handleResponse<Category[]>(response);
  }

  async createCategory(category: {
    name: string;
    description?: string;
  }): Promise<Category> {
    const response = await this.axiosInstance.post(`/category/`, category);
    return this.handleResponse<Category>(response);
  }

  async updateCategory(
    categoryId: string,
    category: { name: string; description?: string }
  ): Promise<Category> {
    const response = await this.axiosInstance.put(`/category/${categoryId}`, category);
    return this.handleResponse<Category>(response);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const response = await this.axiosInstance.delete(`/category/${categoryId}`);
    this.handleResponse<void>(response);
  }

  async assignCategoryToBook(
    bookId: string,
    categoryId: string
  ): Promise<void> {
    const response = await this.axiosInstance.post(
      `/category/assign/${bookId}/${categoryId}`
    );
    this.handleResponse<void>(response);
  }

  async unassignCategoryFromBook(
    bookId: string,
    categoryId: string
  ): Promise<void> {
    const response = await this.axiosInstance.post(
      `/category/unassign/${bookId}/${categoryId}`
    );
    this.handleResponse<void>(response);
  }

  // Astrology operations
  async getAstrologyPrediction(
    query: string,
    turnstileToken: string
  ): Promise<any> {
    const response = await this.axiosInstance.post(`/astrology/predict`, {
      query,
      turnstile_token: turnstileToken,
    });
    return this.handleResponse<any>(response);
  }

  // authentication
  async userLogin(
    username: string,
    password: string
  ): Promise<{ access_token: string}> {
    
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await this.axiosInstance.post(`/auth/login`, formData);
    return this.handleResponse<{ access_token: string}>(response);
  }

  async userLogout(): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/auth/logout`);
    return this.handleResponse<{ message: string }>(response);
  }

  async getUserPermissions(): Promise<UserPermissions> {
    const response = await this.axiosInstance.get(`/permissions/me`);
    return this.handleResponse<UserPermissions>(response);
  }

  async userTokenRefresh(): Promise<{ access_token: string }> {
    const response = await this.axiosInstance.post(`/auth/refresh`);
    return this.handleResponse<{ access_token: string }>(response);
  }

  // User Ops
  async registerUser(user: UserCreate): Promise<UserSummary> {
    const response = await this.axiosInstance.post(`/auth/register`, user);
    return this.handleResponse<UserSummary>(response);
  }   

  async updateUser(userId: string, update: UserUpdate): Promise<UserUpdate> {
    const response = await this.axiosInstance.patch(`/user/${userId}`, update);
    return this.handleResponse<UserUpdate>(response);
  }

  async deleteUser(userId: string): Promise<string> {
    const response = await this.axiosInstance.delete(`/user/${userId}`);
    return this.handleResponse<string>(response);
  }

  async getAllUsers(): Promise<UserSummary[]> {
    const response = await this.axiosInstance.get(`/user/all`);
    return this.handleResponse<UserSummary[]>(response);
  }
}

export const apiService = new ApiService();
export default apiService;
