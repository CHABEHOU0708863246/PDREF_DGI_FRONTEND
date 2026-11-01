export interface FilePolicy {
  maximumFiles: number;
  maximumFileSizeBytes: number;
  maximumTotalSizeBytes: number;
  minimumPdfCount: number;
  allowedContentTypes: string[];
}

export interface FileVersion {
  id: string;
  fileGroupId: string;
  versionNumber: number;
  originalName: string;
  detectedContentType: string;
  sizeBytes: number;
  sha256: string;
  status: string;
  scanStatus: string;
  createdAt: string;
}

export interface FileGroup {
  id: string;
  ownerType: string | null;
  ownerId: string | null;
  currentVersion: number;
  currentFile: FileVersion | null;
}
