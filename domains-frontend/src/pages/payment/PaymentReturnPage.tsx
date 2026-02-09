import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import Axios from 'axios';
import { getAccessToken } from '~/utils/authTokens';

interface PaymentStatusResponse {
  paymentId: string;
  status: string;
  paid: boolean;
  domainsCreated: boolean;
  operationStatus?: string;
}

const PaymentReturnPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!paymentId) {
        navigate('/payment/fail');
        return;
      }

      try {
        const token = getAccessToken();
        const { data } = await Axios.post<PaymentStatusResponse>(
          `/api/payments/${paymentId}/check`,
          {},
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (data?.paid) {
          navigate(`/payment/success?paymentId=${paymentId}`);
        } else if (data?.status === 'FAILED') {
          navigate('/payment/fail');
        } else {
          navigate(`/payment/success?paymentId=${paymentId}`);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
        navigate('/payment/fail');
      }
    };

    checkPaymentStatus();
  }, [paymentId, navigate]);

  return null;
};

export default PaymentReturnPage;
