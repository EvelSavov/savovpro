/**
 * Shared contact & site constants — single source of truth.
 */
(function () {
  'use strict';

  var C = {
    siteUrl: 'https://savovpro.com',
    phone: '+359884121606',
    phoneDisplay: '+359 884 121 606',
    email: 'info@savovpro.com',
    waNumber: '359884121606',
    address: {
      locality: 'Късак',
      region: 'Смолян',
      country: 'BG',
    },
    social: {
      facebook: 'https://www.facebook.com/savovpro',
      instagram: 'https://www.instagram.com/savovpro',
      tiktok: 'https://www.tiktok.com/@savovpro',
    },
  };

  window.SITE_CONFIG = C;

  window.getWaLink = function (text) {
    return 'https://wa.me/' + C.waNumber + '?text=' + encodeURIComponent(text || '');
  };

  window.getEmailLink = function (subject, body) {
    return 'mailto:' + C.email
      + '?subject=' + encodeURIComponent(subject || '')
      + '&body=' + encodeURIComponent(body || '');
  };
})();
