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
exports.sms = function () {
  var smsFunctions = _ = {
    sendIt: function (message, mobile) {
      if (process.env.NODE_ENV !== 'PROD') {
        return ;
      }
      message.mobile = mobile;
      mobileService.sendSMS(message);
    },
    cancel: function (don) {
      var messageContent = {
        message: 'يؤسفنا إلغائك طلبك رقم : ' + don.orderNumber + '\nلا تتردد في ارسال أي ملاحظة  على support@autotash.net \nشكرا لك.'
      };
      this.sendIt(messageContent, don.mobile);
    },
    success: function (don) {
      var messageContent = {
        message: 'شكرا لك\nطلبك وصل\nمندوبينا شغالين على التسعير\nرقم طلبك : ' + don.orderNumber
      };
      this.sendIt(messageContent, don.mobile);
    },
    priced: function (don) {
      var messageContent = {
        message: 'تسعيرة طلبك جاهزة\n' +
          'شوف السعر و أكد طلبك من الرابط :\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile + '/?confirmToken=' + don.confirmToken + '\nرمز التأكيد :\n' + don.confirmToken
      };
      this.sendIt(messageContent, don.mobile);
    },
    notfound: function (don) {
      var messageContent = {
        message: 'عميلنا العزيز..\n للأسف لم نتمكن من توفير القطعة المطلوبة للطلب رقم ' + don.orderNumber + '\nنعدك بتحسين خدماتنا وتوفير قطع أكثر في المرات القادمة.'
      };
      this.sendIt(messageContent, don.mobile);
    },
    changetype: function (don) {
      var currentpt = (don.partType === 'up' ? 'up' : 'np');
      var otherpt = (don.partType === 'up' ? 'np' : 'up');
      var messageContent = {
        message: 'عميلنا العزيز..\n للأسف لم نتمكن من توفير القطعة المطلوبة في قسم ' + translate[currentpt] + '\n' +
          'لطلب القطعة من قسم :' + translate[otherpt] + '\nhttps://' + process.env.SITE_URL + '/switch-request/' + don.orderNumber + '/' + don.mobile + '/' + don.confirmToken + '/'
      };
      this.sendIt(messageContent, don.mobile);
    },
    notavailable: function (don) {
      var currentpt = (don.partType === 'up' ? 'up' : 'np');
      var otherpt = (don.partType === 'up' ? 'np' : 'up');
      var messageContent = {
        message: 'عميلنا العزيز..\n للأسف لم نتمكن من توفير القطعة المطلوبة في قسم ' + translate[currentpt] + '\n' +
          'لطلب القطعة من قسم :' + translate[otherpt] + '\nhttps://' + process.env.SITE_URL + '/switch-request/' + don.orderNumber + '/' + don.mobile + '/' + don.confirmToken + '/'
      };
      this.sendIt(messageContent, don.mobile);
    },
    pendingfromvendor: function (don) {
      var messageContent = {
        message: 'عميلنا العزيز..\n لا زال طلبك رقم : ' + don.orderNumber + '، في انتظار التسعيرة'
      };
      this.sendIt(messageContent, don.mobile);
    },
    incomplete: function (don) {
      var messageContent = {
        message: 'بيانات طلبك غير مكتملة، من صفحة الطلب اختر تعديل و ادخل البيانات المطلوبة\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile
      };
      this.sendIt(messageContent, don.mobile);
    },
    confirmed: function (don){
      var messageContent = {
        message: 'تم تأكيد طلبك، فضلا قم بقراءة الشروط و الاحكام قبل الدفع و طلب التوصيل\n' +
        'https://autotash.net/terms' + '\n' +
        'شكرا لك.'
      };
      this.sendIt(messageContent, don.mobile);
    },
    confirmToken: function (don) {
      var messageContent = {
        message: 'لإجراء اي تعديلات على طلبك رقم : ' +
        don.orderNumber + '، قم بإستعمال رمز التأكيد : \n' + don.confirmToken
      };
      this.sendIt(messageContent, don.mobile);
    },
    delivered: function (don) {
      var messageContent = {
        message: 'تم توصيل طلبك رقم :' + don.orderNumber + ' بنجاح.\n' +
          'نتمنى ان خدمتنا عجبتك، و اذا عندك اي ملاحظة صغيرة او كبيرة نحب نسمعها منك على ايميل الدعم' +
          '\nsupport@autotash.net\nشكرا لك'
      };
      this.sendIt(messageContent, don.mobile);
    },
    sendBill: function (don) {
      var messageContent = {
        message: 'تم اصدار فاتورة لطلبك رقم :' + don.orderNumber + '\nلتحميل الفاتورة :\n' +
          'https://' + process.env.SITE_URL + '/bills/' + don.orderNumber + '-' + don.mobile + '.pdf'
      };
      this.sendIt(messageContent, don.mobile);
    },
    requestedImage: function (don) {
      var messageContent = {
        message: 'تم رفع صورة القطعة المطلوبة بناء على طلبكم.' +
        '\nلمشاهدة صورة القطعة :' +
        '\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile
      };
      this.sendIt(messageContent, don.mobile);
    },
    notdecided: function (don) {
      var messageContent = {
        message: 'طلبك موجود عندنا، و تقدر تأكده في اي وقت،\n' + 'رابط الطلب' +
        '\nhttps://' + process.env.SITE_URL + '/show-request/' + don.orderNumber + '/' + don.mobile + '\n' +
        'اذا عندك اي استفسار تقدر تراسلنا على \nsupport@autotash.net'
      };
      this.sendIt(messageContent, don.mobile);
    },
    newuser: function (don) {
      var messageContent = {
        message: 'تم انشاء حسابك في اوتوتاش' + '\n' +
        'اسم المستخدم : ' + don.username + '\n' +
        'كلمة المرور : ' + don.password + '\n' +
        '\nhttps://' + process.env.SITE_URL + '/login/'
      };
      this.sendIt(messageContent, don.mobile);
    },
    changepassword: function (don) {
      var messageContent = {
        message: 'تم تغيير كلمة المرور الخاصة بك :' + '\n' +
        'اسم المستخدم : ' + don.username + '\n' +
        'كلمة المرور : ' + don.password + '\n' +
        '\nhttps://' + process.env.SITE_URL + '/login/'
      };
      this.sendIt(messageContent, don.mobile);
    },
    returned: function (don) {
      var messageContent = {
        message: 'نأسف لإرجاعك طلبك، في حالة تم الدفع عبر حوالة بنكية، سيتم ارجاع المبلغ إلى حسابكم في خلال ثلاثة أيام عمل كحد أقصى.\n' +
        'نعدكم بتحسين خدماتنا مستقبلا.'
      };
      this.sendIt(messageContent, don.mobile);
    },
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
  var deliveryChannel = 'someurl',
    cashierHook = 'someurl',
    debugsHook = 'someurl',
    transactionHook = 'someurl',
    slackFunctions = {
      requestConfirmed: function (don) {
        var message = {
          'response_type': 'in_channel',
          'title': 'طلب مؤكد جديد',
          'text': 'تم تأكيد الطلب رقم : *' + don.orderNumber + '* يرجى التواصل مع العميل للتوصيل\n' +
          'نوع الطلب : *' + translate[don.partType] + '*\n' +
            'رقم الجوال : *' + don.mobile + '*\n' +
            'نوع السيارة : *' + don.brand + '*\n' +
            'القطع المطلوبة : *' + don.parts[0].partName + '*\n' +
            'المدينة : *' + (translate[don.city] !== undefined ? translate[don.city] : don.city) + '*\nhttps://' + process.env.SITE_URL +
            '/request-set-price/' + don.orderNumber + '/' + don.mobile + '/'
        };
        slack(deliveryChannel).send(message);
      },
      requestCanceled: function (don) {
        var message = {
          'response_type': 'in_channel',
          'title': 'طلب ملغي',
          'text': 'تم إلغاء الطلب رقم : *' + don.orderNumber + '*\nنوع الطلب : *' + translate[don.partType] + '*' + '*\nالسبب :\n*' + don.complain + '*\nرابط الطلب :\nhttps://' + process.env.SITE_URL + '/request-set-price/' + don.orderNumber + '/' + don.mobile
        };
        slack(deliveryChannel).send(message);
      },
      requestDelivered: function (don) {
        var message = {
          'response_type': 'in_channel',
          'title': 'تم توصيل الطلب بنجاح',
          'text': 'يعطيكم العافية يا رهيبين، وصلنا الطلب رقم :*' + don.orderNumber + '* للعميل بنجاح في مدينة *' + (translate[don.city] || don.city) +
              '*\nنوع الطلب : *' + translate[don.partType] + '*' +
              '*\nنوع السيارة : *' + don.brand + '*' +
              '\n القطع الموصلة : *' + don.parts[0].partName + '*' +
               '\nعساكم عالقوة'
        };
        slack(cashierHook).send(message);
      },
      requestNotDecided: function (don) {
        var message = {
          'response_type': 'in_channel',
          'title': 'العميل لم يقرر بعد',
          'text': 'العميل شاف التسعيرة للطلب رقم :*' + don.orderNumber + '* لكن لم يقرر الشراء بعد ' +
          '\nنوع الطلب : *' + translate[don.partType] + '*' +
          '\nمعلومات العميل :' +
          '\nالمدينة :* ' + (translate[don.city] || don.city) + '*' +
          '\nنوع السيارة : *' + don.brand + '*' +
          '\nرابط الطلب :\nhttps://' + process.env.SITE_URL + '/request-set-price/' + don.orderNumber + '/' + don.mobile
        };
        slack(deliveryChannel).send(message);
      },
      requestReturned: function (don) {
        var message = {
          'response_type': 'in_channel',
          'title': 'طلب ارجاع',
          'text': 'مرتجع جديد بقيمة : ' + don.total + '\n' +
          'للطلب رقم : ' + don.orderNumber + '\n' +
          'نوع الطلب : ' + translate[don.partType]
        };
        slack(cashierHook).send(message);
      },
      paymentSent: function (don) {
        var message = {
          'response_type': 'in_channel',
          'title': 'حوالة جديدة',
          'text': 'رقم الطلب : *' + don.orderNumber + '*\n' +
          'نوع الطلب : *' + translate[don.partType] + '*\n' +
          'مرسلة من بنك : *' + translate.banks[don.transfer.debitedBank] + '*\n' +
          'مرسلة إلى بنك : *' + translate.banks[don.transfer.creditedBank] + '*\n' +
          'اسم صاحب الحساب : *' + don.transfer.accountHolder + '*\n' +
          'آخر أربع أرقام من الحساب : *' + don.transfer.accountNumber + '*\n' +
          'المبلغ المرسل : *_' + don.amount + '_*\n' +
          'رابط الطلب :\nhttps://' + process.env.SITE_URL + '/request-set-price/' + don.orderNumber + '/' + don.customerMobile
        };
        slack(transactionHook).send(message);
      },
      debugs: function (don) {
        var message = {
          'response_type': 'in_channel',
          'title': 'خطأ',
          'text': 'حصل خطأ أثناء استخدام الموقع : ' + '```' + don.err + '```' + '\n' +
          '_رابط الخطأ_ : ' + '`' + don.originalUrl + '`' + '\n' +
          '_بيانات مرسلة_ : ' + '```' + don.bodyLoad + '```'
        };
        slack(debugsHook).send(message);
      }
    };

  return slackFunctions;
};
