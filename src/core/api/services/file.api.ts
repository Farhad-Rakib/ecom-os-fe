import { BaseRepository } from '../base.repository';

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    fileName: string;
  };
  message: string;
}

class FileApi extends BaseRepository {
  constructor() {
    super('/Files', 'multipart/form-data');
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.post<UploadResponse>('/upload', formData);
    if (!response.success) {
      throw new Error(response.message || 'Upload failed');
    }
    return response.data.url;
  }
}

export const fileApi = new FileApi();
