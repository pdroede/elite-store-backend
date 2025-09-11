// Sistema de gestão de pedidos
class OrderManager {
  constructor() {
    this.orders = new Map(); // Em produção, use um banco de dados
    this.loadOrders();
  }

  // Carregar pedidos salvos (simulate database)
  loadOrders() {
    try {
      const fs = require('fs');
      if (fs.existsSync('orders.json')) {
        const data = fs.readFileSync('orders.json', 'utf8');
        const ordersArray = JSON.parse(data);
        ordersArray.forEach(order => {
          this.orders.set(order.id, order);
        });
        console.log(`📦 Loaded ${this.orders.size} orders`);
      }
    } catch (error) {
      console.log('No previous orders found');
    }
  }

  // Salvar pedidos (simulate database)
  saveOrders() {
    try {
      const fs = require('fs');
      const ordersArray = Array.from(this.orders.values());
      fs.writeFileSync('orders.json', JSON.stringify(ordersArray, null, 2));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  // Criar novo pedido
  createOrder(paymentIntent, customerInfo, cartItems) {
    const order = {
      id: paymentIntent.id,
      orderId: this.generateOrderNumber(),
      status: 'pending',
      paymentStatus: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer: {
        email: customerInfo.email,
        name: customerInfo.name,
        phone: customerInfo.phone || '',
        address: {
          line1: customerInfo.address?.line1 || '',
          line2: customerInfo.address?.line2 || '',
          city: customerInfo.address?.city || '',
          postal_code: customerInfo.address?.postal_code || '',
          state: customerInfo.address?.state || '',
          country: customerInfo.address?.country || 'PT'
        }
      },
      items: cartItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackingNumber: null,
      notes: ''
    };

    this.orders.set(order.id, order);
    this.saveOrders();
    
    console.log(`📝 New order created: ${order.orderId}`);
    return order;
  }

  // Atualizar status do pedido
  updateOrderStatus(paymentIntentId, status, trackingNumber = null) {
    const order = this.orders.get(paymentIntentId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
      }
      this.saveOrders();
      console.log(`📦 Order ${order.orderId} updated to: ${status}`);
      return order;
    }
    return null;
  }

  // Listar todos os pedidos
  getAllOrders() {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // Buscar pedido por ID
  getOrder(paymentIntentId) {
    return this.orders.get(paymentIntentId);
  }

  // Buscar pedido por número
  getOrderByNumber(orderNumber) {
    return Array.from(this.orders.values()).find(order => 
      order.orderId === orderNumber
    );
  }

  // Gerar número do pedido
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ES${year}${month}${day}${random}`;
  }

  // Estatísticas de vendas
  getStats() {
    const orders = this.getAllOrders();
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalOrders: orders.length,
      totalRevenue: totalRevenue / 100, // Convert from cents
      currency: 'EUR',
      ordersByStatus,
      recentOrders: orders.slice(0, 10)
    };
  }
}

module.exports = OrderManager;
