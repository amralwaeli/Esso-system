import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { Button } from '../components/ui/button';

export function PinLock() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithPin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (currentPin: string) => {
    if (currentPin.length !== 4) return;

    setLoading(true);
    setError('');

    try {
      const staff = await loginWithPin(currentPin);
      if (staff) {
        switch (staff.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'cashier':
            navigate('/cashier');
            break;
          case 'accounting':
          case 'logistics':
            navigate('/accounting');
            break;
          case 'inventory':
            navigate('/inventory');
            break;
          default:
            setError('Invalid role');
            setPin('');
        }
      } else {
        setError('Invalid PIN. Try again.');
        setPin('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Check Firebase configuration.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit(pin);
    }
  }, [pin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e07856] to-[#d4622e] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">POS System</CardTitle>
          <CardDescription>Enter your 4-digit PIN to access the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={(value) => {
                setPin(value);
                setError('');
              }}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {loading && (
            <p className="text-sm text-center text-gray-500">Signing in...</p>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, idx) => (
              <Button
                key={idx}
                variant={num === '' ? 'ghost' : 'outline'}
                size="lg"
                disabled={num === '' || loading}
                onClick={() => {
                  if (num === '⌫') {
                    setPin(pin.slice(0, -1));
                    setError('');
                  } else if (typeof num === 'number' && pin.length < 4) {
                    setPin(pin + num);
                    setError('');
                  }
                }}
              >
                {num}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}