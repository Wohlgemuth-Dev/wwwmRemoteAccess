import { useEffect, useMemo, useState } from 'react';
import { setApiErrorListener } from '../../service/api/errorEvents';
import './ApiErrorPopup.css';

const MAX_MESSAGE_COUNT = 4;
const AUTO_DISMISS_MS = 6000;

type ApiPopupMessage = {
    id: number;
    text: string;
};

const ApiErrorPopup = () => {
    const [messages, setMessages] = useState<ApiPopupMessage[]>([]);

    useEffect(() => {
        setApiErrorListener((message) => {
            setMessages((current) => {
                const next = [...current, { id: Date.now() + Math.random(), text: message }];
                if (next.length <= MAX_MESSAGE_COUNT) {
                    return next;
                }
                return next.slice(next.length - MAX_MESSAGE_COUNT);
            });
        });

        return () => {
            setApiErrorListener(null);
        };
    }, []);

    useEffect(() => {
        if (messages.length === 0) {
            return;
        }

        const timer = window.setTimeout(() => {
            setMessages((current) => current.slice(1));
        }, AUTO_DISMISS_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [messages]);

    const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

    if (!hasMessages) {
        return null;
    }

    return (
        <div className="api-error-popup-container" role="region" aria-live="polite" aria-label="API errors">
            {messages.map((message) => (
                <div key={message.id} className="api-error-popup" role="alert">
                    <div className="api-error-popup-title">Request failed</div>
                    <div className="api-error-popup-message">{message.text}</div>
                    <button
                        type="button"
                        className="api-error-popup-close"
                        onClick={() => {
                            setMessages((current) => current.filter((item) => item.id !== message.id));
                        }}
                        aria-label="Dismiss error"
                    >
                        Close
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ApiErrorPopup;
