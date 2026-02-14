import { useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, getProjectById} from "../../lib/puter.action";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId } = useOutletContext<AuthContext>()

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const handleBack = () => navigate('/');
    const handleExport = () => {
        if (!currentImage) return;

        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `roomify-${id || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const runGeneration = async (item: DesignItem) => {
        if(!id || !item.sourceImage) return;

        try {
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: item.sourceImage });

            if(result.renderedImage) {
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                const saved = await createProject({ item: updatedItem, visibility: "private" })

                if(saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        } catch (error) {
            console.error('Generation failed: ', error)
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            setIsProjectLoading(true);

            // Try to get from localStorage first (for offline mode)
            try {
                const localProjects = localStorage.getItem('localProjects');
                if (localProjects) {
                    const projects = JSON.parse(localProjects);
                    const localProject = projects.find((p: any) => p.id === id);
                    if (localProject) {
                        console.log("Found project in localStorage:", localProject);
                        if (isMounted) {
                            setProject(localProject);
                            setCurrentImage(localProject.renderedImage || null);
                            setIsProjectLoading(false);
                            hasInitialGenerated.current = false;
                            return;
                        }
                    }
                }
            } catch (localError) {
                console.error("Local storage fetch failed:", localError);
            }

            // Fallback to cloud
            const fetchedProject = await getProjectById({ id });

            if (!isMounted) return;

            setProject(fetchedProject);
            setCurrentImage(fetchedProject?.renderedImage || null);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />

                    <span className="name">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || `Residence ${id}`}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        <div className="panel-actions">
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size="sm" onClick={() => {}} className="share">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing': ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating your 3D visualization</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <div className="panel compare">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Comparison</p>
                            <h3>Before and After</h3>
                        </div>
                        <div className="hint">Drag to compare</div>
                    </div>

                    <div className="compare-stage">
                        {/* FIXED: Check if BOTH images exist */}
                        {project?.sourceImage ? (
                            currentImage ? (
                                // Both images available - show comparison slider
                                <ReactCompareSlider
                                    defaultValue={50}
                                    style={{ width: '100%', height: 'auto' }}
                                    itemOne={
                                        <ReactCompareSliderImage 
                                            src={project.sourceImage} 
                                            alt="Original Floor Plan" 
                                            className="compare-img" 
                                        />
                                    }
                                    itemTwo={
                                        <ReactCompareSliderImage 
                                            src={currentImage} 
                                            alt="AI Rendered" 
                                            className="compare-img" 
                                        />
                                    }
                                />
                            ) : (
                                // Only before image available - show with loading/placeholder
                                <div className="compare-placeholder">
                                    <img 
                                        src={project.sourceImage} 
                                        alt="Original" 
                                        className="compare-img" 
                                    />
                                    {!isProcessing && (
                                        <div className="after-placeholder">
                                            <p>AI Render will appear here</p>
                                            <Button 
                                                size="sm" 
                                                onClick={() => runGeneration(project)}
                                                disabled={isProcessing}
                                            >
                                                Generate Now
                                            </Button>
                                        </div>
                                    )}
                                    {isProcessing && (
                                        <div className="after-loading">
                                            <RefreshCcw className="spinner" />
                                            <p>Generating...</p>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="compare-fallback">
                                <p>No image available</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
export default VisualizerId
