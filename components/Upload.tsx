import React, {useCallback, useEffect, useRef, useState} from 'react'
import {CheckCircle2, ImageIcon, UploadIcon, XCircle} from "lucide-react";
import {PROGRESS_INCREMENT, REDIRECT_DELAY_MS, PROGRESS_INTERVAL_MS} from "../lib/constants";

interface UploadProps {
    onComplete?: (base64Data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const resetUpload = useCallback(() => {
        setFile(null);
        setProgress(0);
        setError(null);
        setIsProcessing(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const validateFile = (file: File): string | null => {
        // Check file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            return "File size exceeds 50MB limit";
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return "Invalid file type. Please upload JPG, PNG, or WEBP";
        }
        
        return null;
    };

    const processFile = useCallback((file: File) => {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsProcessing(true);
        setFile(file);
        setProgress(0);
        setError(null);

        const reader = new FileReader();
        
        reader.onerror = () => {
            setError("Failed to read file. Please try again.");
            resetUpload();
        };
        
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            console.log("File loaded, base64 length:", base64Data.length);

            // Start progress animation
            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + PROGRESS_INCREMENT;
                    if (next >= 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        // Add small delay before redirect for better UX
                        timeoutRef.current = setTimeout(() => {
                            console.log("Calling onComplete with base64 data");
                            onComplete?.(base64Data);
                            timeoutRef.current = null;
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        
        reader.readAsDataURL(file);
    }, [onComplete, resetUpload]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const handleCancel = () => {
        resetUpload();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="upload">
            {!file ? (
                // Upload state
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''} ${error ? 'has-error' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={24} />
                        </div>
                        <p className="drop-text">
                            Click to upload or drag and drop
                        </p>
                        <p className="help-text">
                            JPG, PNG, WEBP • Max 50MB
                        </p>
                        {error && (
                            <div className="error-message">
                                <XCircle size={16} />
                                <span>{error}</span>
                                <button 
                                    className="retry-button"
                                    onClick={() => setError(null)}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Processing state
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {error ? (
                                <XCircle className="error-icon" size={32} />
                            ) : progress === 100 ? (
                                <CheckCircle2 className="success-icon" size={32} />
                            ) : (
                                <ImageIcon className="processing-icon" size={32} />
                            )}
                        </div>

                        <div className="file-info">
                            <h3 className="file-name">{file.name}</h3>
                            <p className="file-size">{formatFileSize(file.size)}</p>
                        </div>

                        {!error && (
                            <div className="progress-container">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${progress}%` }} 
                                    />
                                </div>
                                <p className="progress-text">
                                    {progress < 100 
                                        ? `Processing... ${Math.round(progress)}%` 
                                        : 'Complete! Redirecting...'
                                    }
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="error-container">
                                <p className="error-text">{error}</p>
                                <button 
                                    className="retry-button-large"
                                    onClick={resetUpload}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {!error && progress < 100 && (
                            <button 
                                className="cancel-button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;