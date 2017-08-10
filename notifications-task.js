/*

  Hello Basil,
  By now you might have and idea about how nodejs works, so in short here is what you have to do :
  - Make the code cleaner , shorter and more organized.
  - sepearete the data from the view.
  - use a function to auto make the message content.
  - make this file as a notfication module with submodules , such as shortenurl module, sendsms module and / or slacknotify module.

  Try to do any of the tasks above , it might not be easy but give a shot, try your best.

  Good Luck.

*/
var request = require('request'),
  rp = require('request-promise'),
  mobileService = require('./mobile'),
  translate = require('./translate'),
  nodemailer = require('nodemailer'),
  slack = require('slack-notify'),
  postOptionUrl = function (url){
    var postOptions = {
      uri: 'https://autota.sh/api/short/',
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      json: {
        url: url
      }
    };
    return postOptions;
  }

var dictionary = {
  success : function (don) {
    return 'شكرا لك\nطلبك وصل\nمندوبينا شغالين على التسعير\nرقم طلبك : ' + don.orderNumber;
  },
  cancel : function (don) {
    return 'يؤسفنا إلغائك طلبك رقم : ' + don.orderNumber + '\nلا تتردد في ارسال أي ملاحظة  على support@autotash.net \nشكرا لك.';
  },
  priced : function (don) {
    return 'تسعيرة طلبك جاهزة\n' +
      'شوف السعر و أكد طلبك من الرابط :\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile + '/?confirmToken=' + don.confirmToken + '\nرمز التأكيد :\n' + don.confirmToken;
  },
  notfound : function (don) {
    return  'عميلنا العزيز..\n للأسف لم نتمكن من توفير القطعة المطلوبة للطلب رقم ' + don.orderNumber + '\nنعدك بتحسين خدماتنا وتوفير قطع أكثر في المرات القادمة.';
  },
  changetype : function (don) {
    var currentpt = (don.partType === 'up' ? 'up' : 'np');
    var otherpt = (don.partType === 'up' ? 'np' : 'up');
    return  'عميلنا العزيز..\n للأسف لم نتمكن من توفير القطعة المطلوبة في قسم ' + translate[currentpt] + '\n' +
      'لطلب القطعة من قسم :' + translate[otherpt] + '\nhttps://' + process.env.SITE_URL + '/switch-request/' + don.orderNumber + '/' + don.mobile + '/' + don.confirmToken + '/';
    },
  notavailable : function (don) {
    var currentpt = (don.partType === 'up' ? 'up' : 'np');
    var otherpt = (don.partType === 'up' ? 'np' : 'up');
    return 'عميلنا العزيز..\n للأسف لم نتمكن من توفير القطعة المطلوبة في قسم ' + translate[currentpt] + '\n' +
        'لطلب القطعة من قسم :' + translate[otherpt] + '\nhttps://' + process.env.SITE_URL + '/switch-request/' + don.orderNumber + '/' + don.mobile + '/' + don.confirmToken + '/';
  },
  pendingfromvendor : function (don) {
    return   'عميلنا العزيز..\n لا زال طلبك رقم : ' + don.orderNumber + '، في انتظار التسعيرة';
  },
  incomplete : function (don) {
    return 'بيانات طلبك غير مكتملة، من صفحة الطلب اختر تعديل و ادخل البيانات المطلوبة\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile;
  },
  confirmed: function (don){
    return 'تم تأكيد طلبك، فضلا قم بقراءة الشروط و الاحكام قبل الدفع و طلب التوصيل\n' +
      'https://autotash.net/terms' + '\n' +
      'شكرا لك.';
  },
  confirmToken: function (don) {
    return 'لإجراء اي تعديلات على طلبك رقم : ' +
      don.orderNumber + '، قم بإستعمال رمز التأكيد : \n' + don.confirmToken ;
  },
  delivered: function (don) {
    return 'تم توصيل طلبك رقم :' + don.orderNumber + ' بنجاح.\n' +
        'نتمنى ان خدمتنا عجبتك، و اذا عندك اي ملاحظة صغيرة او كبيرة نحب نسمعها منك على ايميل الدعم' +
        '\nsupport@autotash.net\nشكرا لك';
  },
  sendBill: function (don) {
    return 'تم اصدار فاتورة لطلبك رقم :' + don.orderNumber + '\nلتحميل الفاتورة :\n' +
        'https://' + process.env.SITE_URL + '/bills/' + don.orderNumber + '-' + don.mobile + '.pdf';
  },
  requestedImage: function (don) {
    return 'تم رفع صورة القطعة المطلوبة بناء على طلبكم.' +
      '\nلمشاهدة صورة القطعة :' +
      '\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile;
  },
  notdecided: function (don) {
    return 'طلبك موجود عندنا، و تقدر تأكده في اي وقت،\n' + 'رابط الطلب' +
      '\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile + '\n' +
      'اذا عندك اي استفسار تقدر تراسلنا على \nsupport@autotash.net';
  },
  newuser: function (don) {
    return 'تم انشاء حسابك في اوتوتاش' + '\n' +
      'اسم المستخدم : ' + don.username + '\n' +
      'كلمة المرور : ' + don.password + '\n' +
      '\nhttps://' + process.env.SITE_URL + '/login/';
  },
  changepassword: function (don) {
    return 'تم تغيير كلمة المرور الخاصة بك :' + '\n' +
      'اسم المستخدم : ' + don.username + '\n' +
      'كلمة المرور : ' + don.password + '\n' +
      '\nhttps://' + process.env.SITE_URL + '/login/';
  },
  returned: function (don) {
    return 'نأسف لإرجاعك طلبك، في حالة تم الدفع عبر حوالة بنكية، سيتم ارجاع المبلغ إلى حسابكم في خلال ثلاثة أيام عمل كحد أقصى.\n' +
      'نعدكم بتحسين خدماتنا مستقبلا.';
  },
  requestConfirmed: function (don) {
    return {
      'response_type': 'in_channel',
      'title': 'طلب مؤكد جديد',
      'text': 'تم تأكيد الطلب رقم : *' + don.orderNumber + '* يرجى التواصل مع العميل للتوصيل\n' +
      'نوع الطلب : *' + translate[don.partType] + '*\n' +
        'رقم الجوال : *' + don.mobile + '*\n' +
        'نوع السيارة : *' + don.brand + '*\n' +
        'القطع المطلوبة : *' + don.parts[0].partName + '*\n' +
        'المدينة : *' + (translate[don.city] !== undefined ? translate[don.city] : don.city) + '*\nhttps://' + process.env.SITE_URL +
        '/request-set-price/' + don.orderNumber + '/' + don.mobile + '/';}
  },
  requestCanceled: function (don) {
    return {
      'response_type': 'in_channel',
      'title': 'طلب ملغي',
      'text': 'تم إلغاء الطلب رقم : *' + don.orderNumber + '*\nنوع الطلب : *' + translate[don.partType] + '*' + '*\nالسبب :\n*' + don.complain + '*\nرابط الطلب :\nhttps://' + process.env.SITE_URL + '/request-set-price/' + don.orderNumber + '/' + don.mobile;}
  },
  requestDelivered: function (don) {
    return {
      'response_type': 'in_channel',
      'title': 'تم توصيل الطلب بنجاح',
      'text': 'يعطيكم العافية يا رهيبين، وصلنا الطلب رقم :*' + don.orderNumber + '* للعميل بنجاح في مدينة *' + (translate[don.city] || don.city) +
          '*\nنوع الطلب : *' + translate[don.partType] + '*' +
          '*\nنوع السيارة : *' + don.brand + '*' +
          '\n القطع الموصلة : *' + don.parts[0].partName + '*' +
           '\nعساكم عالقوة';}
    },
    requestNotDecided: function (don) {
      return{
        'response_type': 'in_channel',
        'title': 'العميل لم يقرر بعد',
        'text': 'العميل شاف التسعيرة للطلب رقم :*' + don.orderNumber + '* لكن لم يقرر الشراء بعد ' +
        '\nنوع الطلب : *' + translate[don.partType] + '*' +
        '\nمعلومات العميل :' +
        '\nالمدينة :* ' + (translate[don.city] || don.city) + '*' +
        '\nنوع السيارة : *' + don.brand + '*' +
        '\nرابط الطلب :\nhttps://' + process.env.SITE_URL + '/request-set-price/' + don.orderNumber + '/' + don.mobile;}
      },
      requestReturned: function (don) {
        return {
          'response_type': 'in_channel',
          'title': 'طلب ارجاع',
          'text': 'مرتجع جديد بقيمة : ' + don.total + '\n' +
          'للطلب رقم : ' + don.orderNumber + '\n' +
          'نوع الطلب : ' + translate[don.partType];}
      },
      paymentSent: function (don) {
        return{
          'response_type': 'in_channel',
          'title': 'حوالة جديدة',
          'text': 'رقم الطلب : *' + don.orderNumber + '*\n' +
          'نوع الطلب : *' + translate[don.partType] + '*\n' +
          'مرسلة من بنك : *' + translate.banks[don.transfer.debitedBank] + '*\n' +
          'مرسلة إلى بنك : *' + translate.banks[don.transfer.creditedBank] + '*\n' +
          'اسم صاحب الحساب : *' + don.transfer.accountHolder + '*\n' +
          'آخر أربع أرقام من الحساب : *' + don.transfer.accountNumber + '*\n' +
          'المبلغ المرسل : *_' + don.amount + '_*\n' +
          'رابط الطلب :\nhttps://' + process.env.SITE_URL + '/request-set-price/' + don.orderNumber + '/' + don.customerMobile;}
        },
        debugs: function (don) {
          return {
            'response_type': 'in_channel',
            'title': 'خطأ',
            'text': 'حصل خطأ أثناء استخدام الموقع : ' + '```' + don.err + '```' + '\n' +
            '_رابط الخطأ_ : ' + '`' + don.originalUrl + '`' + '\n' +
            '_بيانات مرسلة_ : ' + '```' + don.bodyLoad + '```';}
          }

};

function getMessage(key, don) {
  return function(don){
    var messageContent = {message: dictionary[key]};
    this.sendIt(messageContent, don.mobile);
  }
}


exports.sms = function () {
  var smsFunctions = _ = {
    sendIt: function (message, mobile) {
      if (process.env.NODE_ENV !== 'PROD') {
        return ;
      }
      message.mobile = mobile;
      mobileService.sendSMS(message);
    },
    cancel: function (don) { getMessage("cancel", don); },
    success: function (don) { getMessage("success", don); },
    priced: function (don) { getMessage("priced", don); },
    notfound: function (don) { getMessage("notfound", don); },
    changetype: function (don) { getMessage("changetype", don); },
    notavailable: function (don) { getMessage("notavailable", don); },
    pendingfromvendor: function (don) { getMessage("pendingfromvendor", don); },
    incomplete: function (don) { getMessage("incomplete", don); },
    confirmed: function (don) { getMessage("confirmed", don); },
    confirmToken: function (don) { getMessage("confirmToken", don); },
    delivered: function (don) { getMessage("delivered", don); },
    sendBill: function (don) { getMessage("sendBill", don); },
    requestedImage: function (don) { getMessage("requestedImage", don); },
    notdecided: function (don) { getMessage("notdecided", don); },
    newuser:function (don) { getMessage("newuser", don); },,
    changepassword: function (don) { getMessage("changepassword", don); },
    returned: function (don) { getMessage("returned", don); },
    vendor_newRequest: function (don) {
      var url = 'https://' + process.env.SITE_URL + '/vendors/edit-quota/' + don.rid + '/';
      rp(postOptionUrl(url), function (error, response, body) {
        var messageContent = {
          message: 'لديك طلب جديد بحاجة إلى تسعير\n' +
              'رقم الطلب : ' + don.orderNumber +
              '\nنوع السيارة : ' + don.brand +
              '\nرابط الطلب : ' +
              '\n' + (response ? response.body.shortUrl : url)
        };
        _.sendIt(messageContent, don.mobileVendor);
        if (error) {
          console.log(error);
        }
      });
    }

  };
  return smsFunctions;
};

exports.slackNotifications = function (req, res) {
  // Slack notifications
  getSlackNotification : function(key, don) {
    return function(don){
      var messageContent = {message: dictionary[key]};
    }
  },
  var deliveryChannel = 'someurl',
    cashierHook = 'someurl',
    debugsHook = 'someurl',
    transactionHook = 'someurl',
    slackFunctions = {
      requestConfirmed: function (don) {
        getSlackNotification ("requestConfirmed",don);
        slack(deliveryChannel).send(message);
      },
      requestCanceled: function (don) {
        getSlackNotification ("requestCanceled",don);
        slack(deliveryChannel).send(message);
      },
      requestDelivered: function (don) {
        getSlackNotification ("requestDelivered",don);
        slack(cashierHook).send(message);
      },
      requestNotDecided: function (don) {
        getSlackNotification ("requestNotDecided",don);
        slack(deliveryChannel).send(message);
      },
      requestReturned: function (don) {
        getSlackNotification ("requestReturned",don);
        slack(cashierHook).send(message);
      },
      paymentSent: function (don) {
        getSlackNotification ("paymentSent",don);
        slack(transactionHook).send(message);
      },
      debugs: function (don) {
        getSlackNotification ("debugs",don);
        slack(debugsHook).send(message);
      }
    };

  return slackFunctions;
};
