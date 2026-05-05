import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface Event {
    id: number;
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    date: string;
    time: string;
    duration: number;
    description: string;
    maxVolunteers: number;
    currentVolunteers?: number;
    points: number;
    badge: string;
    status: 'recruiting' | 'active' | 'completed' | 'cancelled';
    user_id: number;
    created_at: string;
    updated_at: string;
    creator?: {
        firstName: string;
        lastName: string;
        organization?: string;
        role: string;
    };
    attendees?: any[];
}

export const eventService = {
    async getAllEvents(): Promise<Event[]> {
        const response = await apiRequest(API_ENDPOINTS.EVENTS);

        return response.json();
    },

    async joinEvent(eventId: number): Promise<void> {
        const response = await apiRequest(`${API_ENDPOINTS.EVENTS}/${eventId}/join`, {
            method: 'POST',
        });

        return response.json();
    },

    async getUserEvents(): Promise<Event[]> {
        const response = await apiRequest(API_ENDPOINTS.USER_EVENTS);

        return response.json();
    }
};