import { BACKEND_URL } from "../app/config";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { creditUpdateEvent } from "@/hooks/usePayment";

export function useCredits() {
    const { getToken } = useAuth();
    const baseurl = BACKEND_URL;
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchCredits = async () => {
        try {
          setLoading(true);
          const token = await getToken();
          if (!token) return;
    
          const response = await fetch(`${baseurl}/balance`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store', 
          });
    
          if (response.ok) {
            const data = await response.json();
            setCredits(data.credits);
          }
        } catch (error) {
          console.error("Error fetching credits:", error);
        } finally {
          setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredits();
        const handleCreditUpdate = (event: Event) => {
            console.log("Credit update event received");
            if (event instanceof CustomEvent) {
                
                if (event.detail) {
                    setCredits(event.detail);
                }
            }
          
            fetchCredits();
        };
    
        
        creditUpdateEvent.addEventListener("creditUpdate", handleCreditUpdate);
    
        
        const interval = setInterval(fetchCredits, 60 * 1000);
    
        return () => {
            creditUpdateEvent.removeEventListener("creditUpdate", handleCreditUpdate);
            clearInterval(interval);
        };
    }, []);

    return { credits, loading };
}