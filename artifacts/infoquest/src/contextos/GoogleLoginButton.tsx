import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contextos/AuthContext';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center gap-4 w-full mt-4">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            if (credentialResponse.credential) {
              await loginWithGoogle(credentialResponse.credential);
              navigate("/dashboard");
            }
          } catch (error: any) {
            toast.error(error.message || "Error al conectar con Google");
          }
        }}
        onError={() => toast.error("Error en la autenticación")}
        theme="filled_blue"
        shape="pill"
        text="continue_with"
        width="100%"
      />
    </div>
  );
}