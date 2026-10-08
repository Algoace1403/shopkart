let scriptPromise;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => failed(), 15000);
    function failed() {
      clearTimeout(timer);
      script.remove();
      scriptPromise = undefined;
      reject(new Error('Unable to load Razorpay. Check your connection and try again.'));
    }
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      clearTimeout(timer);
      if (window.Razorpay) resolve();
      else failed();
    };
    script.onerror = failed;
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function openPayment(data, shippingAddress) {
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: data.key, amount: data.amount, currency: data.currency,
      order_id: data.razorpayOrderId, name: 'ShopKart', description: 'ShopKart test order',
      prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },
      handler: resolve,
      retry: { enabled: false },
      modal: { ondismiss: () => reject(new Error('Payment cancelled. Your cart is unchanged.')) },
      theme: { color: '#24553b' }
    });
    checkout.on('payment.failed', response => {
      checkout.close();
      reject(new Error(response.error?.description || 'Payment failed. Your cart is unchanged.'));
    });
    checkout.open();
  });
}
