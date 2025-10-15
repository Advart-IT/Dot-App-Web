import { API_URL } from '../profile/apiurl';

interface CompleteInviteRegistrationRequest {
  token: string;
  username: string;
  password: string;
}

interface CompleteInviteRegistrationResponse {
  message: string;
  employee_id: number;
  username: string;
  email: string;
  designation: string;
  department: string;
}

// Complete invite registration
export async function completeInviteRegistration(
  token: string,
  username: string,
  password: string
): Promise<CompleteInviteRegistrationResponse> {
  try {
    console.log('=== completeInviteRegistration Debug ===');
    console.log('Token:', token);
    console.log('Username:', username);
    console.log('API_URL:', API_URL);
    
    // Ensure parameters are strings
    const tokenStr = String(token || '').trim();
    const usernameStr = String(username || '').trim();
    const passwordStr = String(password || '').trim();
    
    if (!tokenStr) {
      throw new Error('Token is required');
    }
    
    if (!usernameStr) {
      throw new Error('Username is required');
    }
    
    if (!passwordStr) {
      throw new Error('Password is required');
    }
    
    // Create URL with query parameters as FastAPI expects them
    const params = new URLSearchParams();
    params.append('token', tokenStr);
    params.append('username', usernameStr);
    params.append('password', passwordStr);
    
    const url = `${API_URL}/api/v1/auth/complete-invite-registration?${params.toString()}`;
    console.log('Request URL with params:', url);
    console.log('Query parameters:', params.toString());
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = `Failed to complete registration: ${response.status}`;
      try {
        const responseText = await response.text();
        console.error('Raw error response:', responseText);
        
        // Try to parse as JSON
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            console.error('Parsed error response data:', errorData);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            // If not JSON, use the raw text
            errorMessage = responseText || errorMessage;
          }
        }
      } catch (parseError) {
        console.error('Failed to read error response:', parseError);
        errorMessage = `Failed to complete registration: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Error completing registration:', error);
    
    // Ensure we always throw a proper Error with a string message
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while completing registration');
    }
  }
}