import {Box} from "lucide-react";
import Button from "./ui/Button";
import {useOutletContext} from "react-router";

interface AuthContext {
  isSignedIn?: boolean;
  userName?: string;
  signIn?: () => Promise<void>;
  signOut?: () => Promise<void>;
  isLoading?: boolean;
}

const Navbar = () => {
    const context = useOutletContext<AuthContext>();
    const { 
        isSignedIn = false, 
        userName, 
        signIn, 
        signOut,
        isLoading = false 
    } = context || {};

    const handleAuthClick = async () => {
        if (!signIn || !signOut) {
            console.error("Auth functions not available");
            return;
        }

        if(isSignedIn) {
            try {
                await signOut();
            } catch (e) {
                console.error(`Sign out failed: ${e}`);
            }
            return;
        }

        try {
            await signIn();
        } catch (e) {
            console.error(`Sign in failed: ${e}`);
        }
    };

    return (
        <header className="navbar">
            <nav className="inner">
                <div className="left">
                    <div className="brand">
                        <Box className="logo" />
                        <span className="name">Roomify</span>
                    </div>

                    <ul className="links">
                        <li><a href="#">Product</a></li>
                        <li><a href="#">Pricing</a></li>
                        <li><a href="#">Community</a></li>
                        <li><a href="#">Enterprise</a></li>
                    </ul>
                </div>

                <div className="actions">
                    {isLoading ? (
                        <span className="loading">Loading...</span>
                    ) : isSignedIn ? (
                        <>
                            <span className="greeting">
                                {userName ? `Hi, ${userName}` : 'Signed in'}
                            </span>
                            <Button size="sm" onClick={handleAuthClick} className="btn">
                                Log Out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={handleAuthClick} size="sm" variant="ghost">
                                Log In
                            </Button>
                            <a href="#upload" className="cta">Get Started</a>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Navbar;