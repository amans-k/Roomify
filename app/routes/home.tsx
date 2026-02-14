import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import {ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react";
import Button from "../../components/ui/Button";
import Upload from "../../components/Upload";
import {useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {createProject, getProjects} from "../../lib/puter.action";

// Define types
interface Project {
    id: string;
    name: string;
    sourceImage: string;
    renderedImage?: string;
    timestamp: number;
}

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Roomify - AI-Powered Floor Plan Visualizer" },
        { name: "description", content: "Upload floor plans and visualize them with AI" },
    ];
}

export default function Home() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const isCreatingProjectRef = useRef(false);

    // Check authentication status
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check if Puter is available
                if (window.puter?.auth) {
                    const isAuthed = await window.puter.auth.isSignedIn();
                    setIsSignedIn(isAuthed);
                } else {
                    setIsSignedIn(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsSignedIn(false);
            }
        };
        
        checkAuth();
    }, []);

    const handleUploadComplete = async (base64Image: string) => {
        console.log("✅ Upload complete, processing image...");
        
        try {
            if(isCreatingProjectRef.current) {
                console.log("Already creating project, skipping...");
                return false;
            }
            isCreatingProjectRef.current = true;
            
            const newId = Date.now().toString();
            const name = `Residence ${newId}`;
            console.log("📁 Creating project:", { id: newId, name });

            const newItem: Project = {
                id: newId, 
                name, 
                sourceImage: base64Image,
                renderedImage: undefined,
                timestamp: Date.now()
            };

            // === FIXED: ALWAYS save to localStorage first (this is your backup) ===
            try {
                const existingProjects = JSON.parse(localStorage.getItem('localProjects') || '[]');
                const updatedProjects = [newItem, ...existingProjects];
                localStorage.setItem('localProjects', JSON.stringify(updatedProjects));
                console.log("💾 Saved to localStorage, total projects:", updatedProjects.length);
            } catch (storageError) {
                console.error("localStorage save failed:", storageError);
            }

            // Update state immediately
            setProjects((prev) => [newItem, ...prev]);

            // === FIXED: Try cloud save in background (doesn't block navigation) ===
            if (isSignedIn) {
                // Don't await - let it happen in background
                createProject({ item: newItem, visibility: 'private' })
                    .then(saved => {
                        if (saved) {
                            console.log("☁️ Cloud save successful:", saved.id);
                            // Update project in state with cloud data if needed
                            setProjects(prev => 
                                prev.map(p => p.id === newId ? saved : p)
                            );
                        }
                    })
                    .catch(cloudError => {
                        console.log("☁️ Cloud save failed (continuing with local):", cloudError);
                        // Don't show error - we have local backup
                    });
            }

            // === FIXED: Navigate immediately - don't wait for cloud ===
            console.log("➡️ Navigating to visualizer...");
            
            // Use requestAnimationFrame for smoother navigation
            requestAnimationFrame(() => {
                navigate(`/visualizer/${newId}`, {
                    state: {
                        initialImage: newItem.sourceImage,
                        initialRendered: null,
                        name: newItem.name,
                        fromUpload: true
                    }
                });
            });
            
            return true;
            
        } catch (error) {
            console.error("❌ Fatal error in handleUploadComplete:", error);
            setError("Failed to create project. Please try again.");
            return false;
        } finally {
            isCreatingProjectRef.current = false;
        }
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setIsLoading(true);
                
                // Try to get from cloud if signed in
                if (isSignedIn) {
                    try {
                        const items = await getProjects();
                        if (items && items.length > 0) {
                            setProjects(items);
                            localStorage.setItem('localProjects', JSON.stringify(items));
                            setError(null);
                            setIsLoading(false);
                            return;
                        }
                    } catch (cloudError) {
                        console.error("Cloud fetch failed, trying local:", cloudError);
                    }
                }
                
                // Fallback to localStorage
                const localProjects = localStorage.getItem('localProjects');
                if (localProjects) {
                    const parsed = JSON.parse(localProjects);
                    setProjects(parsed);
                    console.log("Loaded from localStorage:", parsed.length);
                } else {
                    setProjects([]);
                }
                setError(null);
                
            } catch (error) {
                console.error("Error fetching projects:", error);
                setError("Failed to load projects. Please refresh the page.");
                setProjects([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [isSignedIn]);

    // Save projects to localStorage whenever they change
    useEffect(() => {
        if (projects.length > 0) {
            localStorage.setItem('localProjects', JSON.stringify(projects));
        }
    }, [projects]);

    return (
        <div className="home">
            <Navbar />

            <section className="hero">
                <div className="announce">
                    <div className="dot">
                        <div className="pulse"></div>
                    </div>
                    <p>Introducing Roomify</p>
                </div>

                <h1>Build beautiful spaces at the speed of thought with Roomify</h1>

                <p className="subtitle">
                    Roomify is an AI-first design environment that helps you visualize, render, and ship architectural projects faster than ever.
                    <h2 className=" text-2xl text-primary text-center justify-center p-8 motion-safe:animate-pulse hover:not-only-of-type:">Devloped By Waliullah Shaikh</h2>
                </p>

                <div className="actions">
                    <a href="#upload" className="cta">
                        Start Building <ArrowRight className="icon" />
                    </a>
                    <Button variant="outline" size="lg" className="demo">
                        Watch Demo
                    </Button>
                </div>

                {!isSignedIn && (
                    <div className="auth-warning">
                        <p>⚠️ You're in offline mode. Your projects will be saved locally.</p>
                        <button 
                            className="auth-button"
                            onClick={async () => {
                                try {
                                    if (window.puter?.auth) {
                                        const user = await window.puter.auth.signIn();
                                        setIsSignedIn(!!user);
                                    } else {
                                        alert("Puter SDK not loaded. Please refresh the page.");
                                    }
                                } catch (error) {
                                    console.error("Sign in failed:", error);
                                }
                            }}
                        >
                            Sign in with Puter
                        </button>
                    </div>
                )}

                {error && (
                    <div className="error-banner">
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>Refresh</button>
                    </div>
                )}

                <div id="upload" className="upload-shell">
                    <div className="grid-overlay" />
                    <div className="upload-card">
                        <div className="upload-head">
                            <div className="upload-icon">
                                <Layers className="icon" />
                            </div>
                            <h3>Upload your floor plan</h3>
                            <p>Supports JPG, PNG formats up to 10MB</p>
                        </div>
                        <Upload onComplete={handleUploadComplete} />
                    </div>
                </div>
            </section>

            <section className="projects">
                <div className="section-inner">
                    <div className="section-head">
                        <div className="copy">
                            <h2>Projects</h2>
                            <p>Your latest work and shared community projects, all in one place.</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading">Loading projects...</div>
                    ) : projects.length === 0 ? (
                        <div className="no-projects">
                            <p>No projects yet. Upload a floor plan to get started!</p>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {projects.map((project) => (
                                <div 
                                    key={project.id} 
                                    className="project-card group" 
                                    onClick={() => {
                                        console.log("Navigating to project:", project.id);
                                        navigate(`/visualizer/${project.id}`, {
                                            state: {
                                                initialImage: project.sourceImage,
                                                initialRendered: project.renderedImage || null,
                                                name: project.name
                                            }
                                        });
                                    }}
                                >
                                    <div className="preview">
                                        <img 
                                            src={project.sourceImage} 
                                            alt={project.name}
                                            onError={(e) => {
                                                console.log("Image failed to load, using placeholder");
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Rmxvb3IgUGxhbjwvdGV4dD48L3N2Zz4=';
                                            }}
                                        />
                                        {project.renderedImage && (
                                            <div className="badge">
                                                <span>Rendered</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        <div>
                                            <h3>{project.name}</h3>
                                            <div className="meta">
                                                <Clock size={12} />
                                                <span>{new Date(project.timestamp).toLocaleDateString()}</span>
                                                <span>By {isSignedIn ? 'You' : 'Local'}</span>
                                            </div>
                                        </div>
                                        <div className="arrow">
                                            <ArrowUpRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}