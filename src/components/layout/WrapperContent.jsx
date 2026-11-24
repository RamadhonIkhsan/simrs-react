import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ModalConfirm from '@/components/util/ModalConfirm';
import ModalNotif from '@/components/util/ModalNotif';
import menuStore from '@/store/menuStore';
import Sidebar from './Sidebar/Sidebar';

export default function WrapperContent({ children }) {
    const location = useLocation();
    const { setLoadingPageStatus } = menuStore();

    useEffect(() => {
        setLoadingPageStatus(false);
    }, [location.pathname, setLoadingPageStatus]);

    const MotionDiv = motion.div;

    return (
        <>
            <Sidebar />
            <div className="card-main-content">
                <MotionDiv
                    style={{
                        height: '100%',
                        overflow: 'auto',
                    }}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 0 }}
                >
                    <div className="card-layout">{children}</div>
                </MotionDiv>
            </div>
            <ModalConfirm />
            <ModalNotif />
        </>
    );
}
