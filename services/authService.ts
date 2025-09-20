import { User, Meeting } from '../types.ts';
import { secureStorage, sanitizeInput } from '../utils/security';
import { sendAdminNotification } from './adminService';

const DB_KEY = 'audiomax-data';

interface AppData {
    users: User[];
    currentUserEmail: string | null;
}

const getInitialData = (): AppData => ({
    users: [],
    currentUserEmail: null
});

// --- Start of Seeding Logic ---

const getDemoMeeting = (): Meeting => {
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const durationSeconds = 95;
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
    return {
        id: 'demo-meeting-1',
        title: "Project Phoenix - Q3 Kick-off",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: "1m 35s",
        durationSeconds,
        audioUrl: '', // No playable audio for demo
        status: 'Transcribed',
        transcript: [
            { speaker: "Speaker 1", timestamp: "00:05", text: "Alright everyone, let's kick off the Project Phoenix discussion for Q3." },
            { speaker: "Speaker 2", timestamp: "00:12", text: "Thanks, Sarah. First on the agenda is the budget review. We're currently tracking slightly over." },
            { speaker: "Speaker 1", timestamp: "00:25", text: "Okay, we need to identify areas to optimize. The key decision we need to make today is whether to delay the feature-Z rollout or cut marketing spend." },
            { speaker: "Speaker 2", timestamp: "00:40", text: "Given the market conditions, I think pausing the marketing campaign is less risky. Delaying the rollout could cost us our first-mover advantage." },
            { speaker: "Speaker 3", timestamp: "00:55", text: "I agree. Let's re-allocate the marketing funds. John, can you take the action item to draft a revised budget by Friday?" },
            { speaker: "Speaker 1", timestamp: "01:10", text: "Perfect. So the decision is made. We'll cut marketing spend for now. John will present the new budget next week." },
        ],
        summary: {
            executiveSummary: "The meeting focused on addressing the budget overrun for Project Phoenix in Q3. The primary discussion revolved around choosing between delaying a key feature launch or reducing marketing expenditure. The team concluded that preserving the launch timeline was critical.",
            actionItems: [
                { item: "Draft a revised budget re-allocating marketing spend.", assignee: "John" }
            ],
            keyDecisions: [
                { decision: "Marketing spend will be temporarily cut to address the budget overrun.", rationale: "This was deemed less risky than delaying the feature-Z rollout, which could result in losing a competitive advantage." }
            ]
        }
    };
};


const initializeDatabase = () => {
    const rawData = secureStorage.get(DB_KEY);
    if (rawData) return; // Already initialized

    console.log("Initializing database with default users...");
    const data: AppData = getInitialData();

    // Add Super Admin
    data.users.push({
        email: 'admin@audiomax.com',
        password: 'superadmin123',
        subscription: 'Enterprise',
        meetings: []
    });

    // Add Demo User
    data.users.push({
        email: 'demo@audiomax.com',
        password: 'demouser123',
        subscription: 'Free',
        meetings: [getDemoMeeting()]
    });

    writeData(data);
};

// --- End of Seeding Logic ---

const readData = (): AppData => {
    try {
        const parsedData = secureStorage.get(DB_KEY);
        if (parsedData && parsedData.users && typeof parsedData.currentUserEmail !== 'undefined') {
            return parsedData;
        }
    } catch (e) {
        console.error("Failed to parse auth data", e);
    }
    return getInitialData();
};

const writeData = (data: AppData) => {
    try {
        secureStorage.set(DB_KEY, data);
    } catch (e) {
        console.error("Failed to write auth data", e);
    }
};

export const signup = async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    // Sanitize inputs
    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanPassword = sanitizeInput(password);
    
    // Basic validation
    if (!cleanEmail || !cleanPassword) {
        return { user: null, error: "Email and password are required." };
    }
    
    if (cleanEmail.length < 3 || !cleanEmail.includes('@')) {
        return { user: null, error: "Please enter a valid email address." };
    }
    
    if (cleanPassword.length < 6) {
        return { user: null, error: "Password must be at least 6 characters long." };
    }
    
    const data = readData();
    const userExists = data.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (userExists) {
        return { user: null, error: "User with this email already exists." };
    }
    const newUser: User = {
        email: cleanEmail,
        password: cleanPassword, // In a real app, hash this!
        subscription: 'Free',
        meetings: [],
    };
    data.users.push(newUser);
    data.currentUserEmail = cleanEmail;
    writeData(data);
    
    // Send admin notification for new signup
    sendAdminNotification(newUser, 'signup').catch(console.error);
    
    return { user: newUser };
};

export const login = async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    // Sanitize inputs
    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanPassword = sanitizeInput(password);
    
    const data = readData();
    const user = data.users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword);
    if (user) {
        data.currentUserEmail = cleanEmail;
        writeData(data);
        
        // Send admin notification for login
        sendAdminNotification(user, 'login').catch(console.error);
        
        return { user };
    }
    return { user: null, error: "Invalid email or password." };
};

export const logout = () => {
    const data = readData();
    data.currentUserEmail = null;
    writeData(data);
};

export const getCurrentUser = (): User | null => {
    const data = readData();
    if (data.currentUserEmail) {
        return data.users.find(u => u.email.toLowerCase() === data.currentUserEmail!.toLowerCase()) || null;
    }
    return null;
};

export const updateUser = (updatedUser: User) => {
    const data = readData();
    const userIndex = data.users.findIndex(u => u.email.toLowerCase() === updatedUser.email.toLowerCase());
    if (userIndex !== -1) {
        const existingPassword = data.users[userIndex].password;
        data.users[userIndex] = { ...updatedUser, password: updatedUser.password || existingPassword };
        writeData(data);
    } else {
        console.error("Could not find user to update");
    }
};

// Initialize DB on module load
initializeDatabase();