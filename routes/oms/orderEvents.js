var Enum = require('enum');

// exports.orderEvents = new Enum(['CREATION', 'CONFIRMATION', 'PAYMENT', 'CANCELLATION', 'COMMENT']);

exports.orderEvents = new Enum({'CREATION' : 'OrderCreation', 'PAYMENT_UPDATION' : 'OrderUpdation', 'ORDER_UPDATION' : 'OrderUpdationSeller', 'COMMENT' : 'CRM_Comment'});
