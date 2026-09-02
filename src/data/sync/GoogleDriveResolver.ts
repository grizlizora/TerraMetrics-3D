/**
 * Normalizes Google Drive links and generates direct download URLs
 * with virus-scan confirmation bypass for large files.
 */
export class GoogleDriveResolver {
  /**
   * Extracts File ID from Google Drive sharing URLs, IDs, or folder URLs
   */
  public static extractFileId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();

    // 1. Direct alphanumeric ID (25+ chars)
    if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
      return trimmed;
    }

    // 2. Format /file/d/{FILE_ID}/...
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch) return fileDMatch[1];

    // 3. Format /folders/{FOLDER_ID}
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) return folderMatch[1];

    // 4. Format ?id={FILE_ID} or &id={FILE_ID}
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch) return idParamMatch[1];

    // 5. Format /open?id={FILE_ID}
    const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch) return openMatch[1];

    return trimmed;
  }

  /**
   * Generates a direct download URL
   */
  public static buildDirectDownloadUrl(fileIdOrUrl: string, apiKey?: string): string {
    if (!fileIdOrUrl) return '';

    // If it's already a regular HTTP(S) URL not from Google Drive, return as-is
    if (fileIdOrUrl.startsWith('http') && !fileIdOrUrl.includes('drive.google.com') && !fileIdOrUrl.includes('docs.google.com')) {
      return fileIdOrUrl;
    }

    const fileId = this.extractFileId(fileIdOrUrl);
    if (!fileId) return fileIdOrUrl;

    if (apiKey) {
      return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    }

    // Google Drive direct export URL with confirm=t parameter
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }
}
