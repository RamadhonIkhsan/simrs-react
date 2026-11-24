import { useEffect, useState } from 'react';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';

const FullScreenToggle = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <button
            type="button"
            onClick={toggleFullScreen}
            className="btn-expand"
            title="Toggle Fullscreen"
        >
            {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        </button>
    );
};

export default FullScreenToggle;
