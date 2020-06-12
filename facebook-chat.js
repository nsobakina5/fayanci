if (typeof jQuery != "undefined") {
  createFacebookChat();
} else {
  function include(filename, onload) {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.src = filename;
    script.type = "text/javascript";
    script.onload = script.onreadystatechange = function () {
      if (script.readyState) {
        if (
          script.readyState === "complete" ||
          script.readyState === "loaded"
        ) {
          script.onreadystatechange = null;
          onload();
        }
      } else {
        onload();
      }
    };
    head.appendChild(script);
  }

  include(
    "https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js",
    createFacebookChat()
  );
}

function createFacebookChat() {
  $(document).ready(function () {
    var scripts = document.getElementsByTagName("script");
    var myScript = {};
    for (var i = 0; i < scripts.length; i++) {
      var myScript1 = scripts[i];
      var src = myScript1.src;
      if (src.indexOf("facebook-chat.js") > -1) {
        myScript = myScript1;
      }
    }
    var temp = myScript.src.split("?");
    var queryString = temp[temp.length - 1];
    var params = parseQuery(queryString);
    var jsonVersion = params.v ? params.v : 0;

    $("body").append("<div class='otFacbookChat'></div>");
    let facebookChatSettings;
    // Root Link
    var rootLink = "https://apps.omegatheme.com/facebook-chat/";
    // Shop
    var shopFbChat = Shopify.shop;
    $.ajax({
      dataType: "json",
      url: rootLink + "cache/" + shopFbChat + "/data.json?v=" + jsonVersion,
    }).done(function (res) {
      facebookChatSettings = res;

      localStorage.setItem(
        "facebookChatSettings",
        JSON.stringify(facebookChatSettings)
      );

      var html = facebookChatInit(facebookChatSettings);
      $(".otFacbookChat").append(html);
      var position = facebookChatSettings.position,
        window_width = $(window).outerWidth(),
        tab_width = $(".ot-fb-logo").outerWidth(),
        css_tab =
          window_width -
          tab_width -
          (window_width - tab_width) * (parseInt(position) / 100) +
          "px";
      $(".ot-fb-logo.facebook-chat-button").css("right", css_tab);
      var maxZIndex = findHighestZIndex("div");
      $(".ot-fb-logo.facebook-chat-button").css("z-index", maxZIndex + 1);

      if (facebookChatSettings.auto_display == "0") {
        $("#fb-root").css("display", "none");
      }
    });

    $(document).on("click", ".ot-fb-logo", function (e) {
      var object = $(
        ".fb-customerchat.fb_invisible_flow.fb_iframe_widget iframe"
      );
      $("#fb-root").css("display", "block");
      let window_width = $(window).outerWidth();
      if (window_width < 800) {
        if ($(".ot-fb-logo.redirect_icon").length > 0) {
          let pageInfo = JSON.parse(facebookChatSettings.page_info);
          let pageId = pageInfo.id;
          window.open("https://www.messenger.com/t/" + pageId, "_blank");
        }
      }
      if (object.css("max-height") === "0px") {
        FB.Event.subscribe(
          "customerchat.dialogShow",
          processShowDialog(object)
        );
      } else {
        FB.Event.subscribe(
          "customerchat.dialogHide",
          processHideDialog(object)
        );
      }
    });
  });
}

function facebookChatInit(facebookChatSettings) {
  let html = "";
  let windowWidth = $(window).outerWidth();
  let currentDomain =
    window.location.protocol +
    "//" +
    window.location.host +
    "/" +
    window.location.pathname +
    window.location.search;

  if (
    facebookChatSettings.status_connect !== "2" ||
    facebookChatSettings.app_status === "0"
  ) {
    html += "";
  } else {
    html +=
      makeHtml(facebookChatSettings, currentDomain) +
      styleHtml(facebookChatSettings, windowWidth);
  }
  return html;
}

function makeHtml(facebookChatSettings, currentDomain) {
  var language = facebookChatSettings.language;
  var theme_color = facebookChatSettings.theme_color;
  var greeting_message = facebookChatSettings.greeting_message
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
  var page_info = JSON.parse(facebookChatSettings.page_info);

  var icon_type = facebookChatSettings.icon_type;
  var icon_text = facebookChatSettings.icon_text;
  var icon_text_color = facebookChatSettings.icon_text_color;
  var tab_color = facebookChatSettings.tab_color;
  var tab_size = facebookChatSettings.tab_size;

  var icon_html = get_icon_html(icon_type, icon_text, icon_text_color);

  if (facebookChatSettings.auto_display == "1") {
    var display = "show";
  } else {
    var display = "hide";
  }

  if (facebookChatSettings.chat_type == "1") {
    var classAddIcon = "redirect_icon";
  } else {
    var classAddIcon = "";
  }

  var html = `
     <div id='fb-root'></div>
     <script>
     window.fbAsyncInit = function() {
        FB.init({
            appId            : '1919748194980000',
            autoLogAppEvents : true,
            xfbml            : true,
            version          : 'v3.1'
        });
     };
     (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        js = d.createElement(s); js.id = id;
        js.src = 'https://connect.facebook.net/${language}/sdk/xfbml.customerchat.js';
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
      </script>
      <div class='fb-customerchat'
        attribution='setup_tool'
        fb-xfbml-state='rendered'
        page_id='${page_info.id}'
        themeColor='${theme_color}'
        logged_in_greeting="${greeting_message}"
        logged_out_greeting="${greeting_message}"
        rel='${currentDomain}'
        greeting_dialog_display='${display}'
      >
    </div>
    <div>
    <div class='ot-fb-logo ${classAddIcon} facebook-chat-button ${tab_size}' style='background-color: ${tab_color}; fill: ${icon_text_color};  z-index: 9999;'>
        <div style='display: flex; margin: 0'>
           ${icon_html}
        </div>
     </div>
    </div>
  </div>
    `;
  return html;
}

function styleHtml(facebookChatSettings, windowWidth) {
  var position = 100 - parseInt(facebookChatSettings.position);
  var margin_bottom = parseInt(facebookChatSettings.margin_bottom);
  var device_target = facebookChatSettings.device_target;
  var page_target = facebookChatSettings.page_target;
  var html = "";
  var css_append = "";

  if (facebookChatSettings.working_time !== "") {
    var working_time = JSON.parse(facebookChatSettings.working_time);
    if (working_time.status == "0") {
      var timeZone = "";
      switch (working_time.time_zone) {
        case "-12": {
          timeZone = "Pacific/Midway";
          break;
        }
        case "-11": {
          timeZone = "Pacific/Midway";
          break;
        }
        case "-10": {
          timeZone = "Pacific/Honolulu";
          break;
        }
        case "-9": {
          timeZone = "America/Anchorage";
          break;
        }
        case "-8": {
          timeZone = "America/Los_Angeles";
          break;
        }
        case "-7": {
          timeZone = "America/Cambridge_Bay";
          break;
        }
        case "-6": {
          timeZone = "America/Mexico_City";
          break;
        }
        case "-5": {
          timeZone = "America/Atikokan";
          break;
        }
        case "-4": {
          timeZone = "Canada/Atlantic";
          break;
        }
        case "-3": {
          timeZone = "America/Sao_Paulo";
          break;
        }
        case "-2": {
          timeZone = "America/Noronha";
          break;
        }
        case "-1": {
          timeZone = "Atlantic/Azores";
          break;
        }
        case "0": {
          timeZone = "Europe/London";
          break;
        }
        case "1": {
          timeZone = "Europe/Amsterdam";
          break;
        }
        case "2": {
          timeZone = "Europe/Bucharest";
          break;
        }
        case "3": {
          timeZone = "Asia/Baghdad";
          break;
        }
        case "4": {
          timeZone = "Asia/Muscat";
          break;
        }
        case "5": {
          timeZone = "Asia/Karachi";
          break;
        }
        case "6": {
          timeZone = "Asia/Almaty";
          break;
        }
        case "7": {
          timeZone = "Asia/Bangkok";
          break;
        }
        case "8": {
          timeZone = "Asia/Hong_Kong";
          break;
        }
        case "9": {
          timeZone = "Asia/Irkutsk";
          break;
        }
        case "10": {
          timeZone = "Australia/Brisbane";
          break;
        }
        case "11": {
          timeZone = "Asia/Vladivostok";
          break;
        }
        case "12": {
          timeZone = "Pacific/Auckland";
          break;
        }
        default:
          timeZone = working_time.time_zone;
          break;
      }

      var offset = new Date().getTimezoneOffset();
      console.log(offset);

      var currentTime = new Date().toLocaleString("en-US", {
        timeZone: timeZone,
      });
      currentTime = new Date(currentTime);

      var tzYear = currentTime.getFullYear().toLocaleString().replace(",", "");
      var tzMonth = currentTime.getMonth().toLocaleString();
      var tzDay = currentTime.getDay().toLocaleString();
      var tzHour = currentTime.getHours().toLocaleString();
      var tzMinute = currentTime.getMinutes().toLocaleString();

      var currentString =
        tzDay + "/" + tzMonth + "/" + tzYear + "," + tzHour + ":" + tzMinute;
      var currentNewTime = new Date(currentString);
      var currentStamp = currentNewTime.getTime();

      var startString =
        tzDay + "/" + tzMonth + "/" + tzYear + "," + working_time.start;
      var startTime = new Date(startString);
      var startStamp = startTime.getTime();

      var endString =
        tzDay + "/" + tzMonth + "/" + tzYear + "," + working_time.end;
      var endTime = new Date(endString);
      var endStamp = endTime.getTime();

      if (startStamp < currentStamp && endStamp > currentStamp) {
        css_append += "";
      } else {
        css_append += `.otFacbookChat {
              display: none;
           }`;
      }
    }
  }

  // check page target
  if (page_target === "1") {
    if (__st.p !== "home") {
      css_append += `
          .otFacbookChat {
              display: none;
          }
          `;
    }
  } else if (page_target === "2") {
    let pageUrl = __st.pageurl;
    let substring = "cart";

    if (pageUrl.indexOf(substring) !== -1) {
      css_append += `
              .otFacbookChat {
                  display: none;
              }
              `;
    }
  }

  if (device_target == "1") {
    css_append += `
        @media screen and (max-width:768px) {
           .otFacbookChat {
              display: none;
           }
        }
        `;
  } else if (device_target == "2") {
    css_append += `
            @media screen and (min-width:1023px) {
              .otFacbookChat {
                  display: none;
              }
            }
            `;
  }

  var icon_text = facebookChatSettings.icon_text;
  {
    if (icon_text == "") {
      css_append += `.otFacbookChat .ot-fb-logo.facebook-chat-button span{
              display: none;
              }
              .otFacbookChat .ot-fb-logo.facebook-chat-button{
                  padding: 15px; 
              }`;
    }
  }

  var chat_type = facebookChatSettings.chat_type;
  {
    if (chat_type == "1") {
      var chat_type_css = `
              display: none;
              }`;
    } else {
      var chat_type_css = "";
    }
  }

  if (facebookChatSettings.custom_css !== "") {
    var custom_css = JSON.parse(facebookChatSettings.custom_css);
    {
      if (custom_css.status == true) {
        var custom_css_append = custom_css.code;
      }
    }
  }

  let cssDesktop =
    windowWidth -
    360 -
    (windowWidth - 360) * (parseInt(facebookChatSettings.position) / 100) +
    "px!important;";
  let cssMbile =
    windowWidth -
    255 -
    (windowWidth - 255) * (parseInt(facebookChatSettings.position) / 100) +
    "px!important;";
  let marginBottomIframe;
  switch (facebookChatSettings.tab_size) {
    case "small":
      marginBottomIframe = 50;
      break;
    case "medium":
      marginBottomIframe = 60;
      break;
    case "large":
      marginBottomIframe = 70;
      break;
    default:
      marginBottomIframe = 75;
  }
  html += `
      <style>
      .fb_iframe_widget iframe {
          right: ${cssDesktop};
          bottom: ${margin_bottom + marginBottomIframe}px!important;
          min-height: 0!important;
      }
      @media screen and (max-width:768px) {
          .fb_iframe_widget iframe {
          right: ${cssMbile};
          bottom: 80px!important;
          bottom: ${margin_bottom + 50}px!important;
          width: 255px;
          ${chat_type_css}
          }
  
          .fb_iframe_widget.fb_iframe_widget_fluid iframe.fb_customer_chat_bounce_in_v2_mobile_chat_started {
          right: 0px!important;
          }
      }
      </style>
      `;

  html += `<style type='text/css'>
               ${css_append}
  
              .fb_dialog {
                 right: ${position}%!important;
              }
  
              .fb_dialog {
                 display: none!important;
              }
  
              .ot-fb-logo.facebook-chat-button {
                 background-color: #ffffff;
                 fill: #0084FF;
                 box-shadow: 0 3pt 12pt rgba(0,0,0,.15);
                 display: table;
                 float: right;
                 justify-content: center;
                 align-items: center;
                 cursor: pointer;
                 -webkit-transition: border-color .3s;
                 transition: border-color .3s;
                 height: auto;
                 padding: 10px 15px;
                 border-radius: 30px;
                 width: auto;
                 position: fixed;
                 bottom: ${margin_bottom}px;
                 right: ${position}%;
                 margin-right: 10px;
             }
          .ot-fb-logo.facebook-chat-button.medium svg {
              width: 32px;
              height: 32px;
           }
          
          .ot-fb-logo.facebook-chat-button.medium span {
              font-size: 16px;
              margin-top: 3px;
          }
          
          .ot-fb-logo.facebook-chat-button.small svg {
              width: 24px;
              height: 24px;
          }
          
          .ot-fb-logo.facebook-chat-button.small span {
              font-size: 14px;
              margin-top: 2px;
          }
  
          .ot-fb-logo.facebook-chat-button.large {
          }
          
          .ot-fb-logo.facebook-chat-button.large svg {
              width: 40px;
              height: 40px;
          }
          
          .ot-fb-logo.facebook-chat-button.large span {
              font-size: 20px;
              margin-top: 3px;
          }
  
          ${custom_css_append}
  
          </style>`;

  return html;
}

function get_icon_html(icon_type, icon_text, icon_text_color) {
  var icon_html;
  switch (icon_type) {
    case "icon_1":
      icon_html = `<svg
              xmlns='http://www.w3.org/2000/svg'
              width='25'
              height='25'
              viewBox='96 93 322 324'
           >
              <g>
              <path
                 d='M257 93c-88.918 0-161 67.157-161 150 0 47.205 23.412 89.311 60 116.807V417l54.819-30.273C225.449 390.801 240.948 393 257 393c88.918 0 161-67.157 161-150S345.918 93 257 93zm16 202l-41-44-80 44 88-94 42 44 79-44-88 94z'
              ></path>
              <rect x='13.445' y='20.996' width='37' height='4'></rect>
              <rect x='13.445' y='32.828' width='37' height='4'></rect>
              <rect x='13.445' y='44.66' width='37' height='4'></rect>
              </g>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    case "icon_2":
      icon_html = `<svg
              xmlns='http://www.w3.org/2000/svg'
              width='25'
              height='25'
              viewBox='0 0 24 24'
           >
              <path
                 d='M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z'
              ></path>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    case "icon_3":
      icon_html = `<svg
              width='25'
              height='25'
              version='1.1'
              id='Capa_1'
              xmlns='http://www.w3.org/2000/svg'
              xmlns:xlink='http://www.w3.org/1999/xlink'
              x='0px'
              y='0px'
              viewBox='0 0 88.695 88.695'
              xml:space='preserve'
           >
              <g>
                 <path
                 d='M84.351,68.07c2.508-4.59,3.829-9.759,3.829-15.006c0-13.118-8.112-24.36-19.575-29.021 C62.65,12.338,50.493,4.295,36.486,4.295c-19.862,0-36.021,16.159-36.021,36.021c0,6.072,1.541,12.057,4.462,17.36L0,76.059 l18.011-4.824c5.403,3.236,11.549,4.975,17.862,5.082c5.558,5.019,12.913,8.083,20.973,8.083c5.64,0,11.142-1.512,15.971-4.379 l15.878,4.254L84.351,68.07z M18.655,66.921L5.657,70.402l3.561-13.285l-0.419-0.72c-2.835-4.873-4.334-10.434-4.334-16.082 c0-17.656,14.365-32.021,32.021-32.021s32.021,14.364,32.021,32.021S54.142,72.337,36.486,72.337 c-6.066,0-11.976-1.711-17.091-4.948L18.655,66.921z M83.037,78.618l-10.861-2.91l-0.74,0.468C67.07,78.94,62.025,80.4,56.847,80.4 c-5.511,0-10.633-1.656-14.93-4.473c17.294-2.626,30.59-17.595,30.59-35.611c0-3.712-0.565-7.294-1.612-10.667 c7.947,4.786,13.286,13.48,13.286,23.415c0,4.823-1.28,9.57-3.701,13.728l-0.419,0.72L83.037,78.618z'
                 ></path>
              </g>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    case "icon_4":
      icon_html = `<svg
              width='25'
              height='25'
              version='1.1'
              id='Capa_1'
              xmlns='http://www.w3.org/2000/svg'
              xmlns:xlink='http://www.w3.org/1999/xlink'
              x='0px'
              y='0px'
              viewBox='0 0 81.146 81.146'
              xml:space='preserve'
           >
              <g>
                 <path
                 d='M11.902,67.18l0.021-14.51L0,52.559V8.524h64.319v44.053h-31.25L11.902,67.18z M4,48.596l11.928,0.111l-0.016,10.846 l15.911-10.976h28.496V12.524H4V48.596z'
                 ></path>
                 <path
                 d='M81.146,26.524H64.319v-18H0v44.035l11.922,0.111l-0.021,14.51L31.16,53.895v7.167h24.152l16.763,11.561l-0.018-11.495 l9.089-0.084V26.524z M4,48.596V12.524h56.319v36.053H31.823L15.912,59.553l0.016-10.846L4,48.596z M77.146,57.08l-9.095,0.084 l0.012,7.833l-11.505-7.936H35.16v-4.484h29.159V30.524h12.827C77.146,30.524,77.146,57.08,77.146,57.08z'
                 ></path>
              </g>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    case "icon_5":
      icon_html = `<svg
              width='25'
              height='25'
              version='1.1'
              id='Capa_1'
              xmlns='http://www.w3.org/2000/svg'
              xmlns:xlink='http://www.w3.org/1999/xlink'
              x='0px'
              y='0px'
              viewBox='0 0 75.333 75.333'
              xml:space='preserve'
           >
              <g>
                 <path
                 d='M37.666,75.318l-9.413-16.303H17c-9.374,0-17-7.626-17-17v-25c0-9.374,7.626-17,17-17h41.333c9.374,0,17,7.626,17,17v25 c0,9.374-7.626,17-17,17H47.078L37.666,75.318z M17,4.016c-7.168,0-13,5.832-13,13v25c0,7.168,5.832,13,13,13h13.563l7.103,12.302 l7.104-12.303h13.563c7.168,0,13-5.832,13-13v-25c0-7.168-5.832-13-13-13L17,4.016L17,4.016z'
                 ></path>
                 <circle cx='54.822' cy='31.128' r='4.206'></circle>
                 <circle cx='37.667' cy='31.128' r='4.206'></circle>
                 <circle cx='20.511' cy='31.128' r='4.206'></circle>
              </g>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    case "icon_6":
      icon_html = `<svg
              width='25'
              height='25'
              version='1.1'
              id='Capa_1'
              xmlns='http://www.w3.org/2000/svg'
              xmlns:xlink='http://www.w3.org/1999/xlink'
              x='0px'
              y='0px'
              viewBox='0 0 71.015 71.015'
              xml:space='preserve'
           >
              <g>
                 <circle cx='52.46' cy='27.353' r='4.206'></circle>
                 <circle cx='35.306' cy='27.353' r='4.206'></circle>
                 <circle cx='18.151' cy='27.353' r='4.206'></circle>
                 <path
                 d='M13.223,67.769l0.022-15.916L0,51.728V3.247h71.015v48.5H36.448L13.223,67.769z M4,47.765l13.25,0.125l-0.017,12.252 l17.968-12.396h31.813v-40.5H4V47.765z'
                 ></path>
              </g>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    case "icon_7":
      icon_html = `<svg
              width='25'
              height='25'
              version='1.1'
              id='Capa_1'
              xmlns='http://www.w3.org/2000/svg'
              xmlns:xlink='http://www.w3.org/1999/xlink'
              x='0px'
              y='0px'
              viewBox='0 0 69.661 69.661'
              xml:space='preserve'
           >
              <g>
                 <path
                 d='M43.488,64.648H21c-11.58,0-21-9.421-21-21V26.013c0-11.58,9.42-21,21-21h22.488c11.579,0,21,9.42,21,21v17.635 c0,3.057-0.653,6.01-1.944,8.792c0.783,2.971,2.37,5.602,4.724,7.83l2.393,2.265l-3.113,1.077 c-1.682,0.582-3.467,0.877-5.307,0.877l0,0c-2.758,0-5.647-0.651-8.603-1.937C49.798,63.927,46.655,64.648,43.488,64.648z M21,9.013c-9.374,0-17,7.626-17,17v17.635c0,9.374,7.626,17,17,17h22.488c2.841,0,5.655-0.717,8.14-2.073l0.896-0.489l0.923,0.44 c3.047,1.453,5.952,2.116,8.635,1.936c-1.764-2.334-2.972-4.951-3.604-7.818l-0.153-0.697l0.322-0.637 c1.222-2.412,1.841-4.989,1.841-7.661V26.013c0-9.374-7.626-17-17-17H21z'
                 ></path>
                 <circle cx='49.196' cy='35.831' r='4.206'></circle>
                 <circle cx='32.04' cy='35.831' r='4.206'></circle>
                 <circle cx='14.883' cy='35.831' r='4.206'></circle>
              </g>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    case "icon_8":
      icon_html = `<svg
              width='25'
              height='25'
              version='1.1'
              id='Capa_1'
              xmlns='http://www.w3.org/2000/svg'
              xmlns:xlink='http://www.w3.org/1999/xlink'
              x='0px'
              y='0px'
              viewBox='0 0 78.667 78.667'
              xml:space='preserve'
           >
              <g>
                 <path
                 d='M9.49,73.833c-1.493,0-2.943-0.24-4.309-0.713l-3.113-1.077l2.392-2.265c3.166-2.998,3.965-6.456,4.017-9.046 C3.004,54.666,0,47.098,0,39.334c0-19.023,17.645-34.5,39.333-34.5s39.334,15.477,39.334,34.5 c0,19.022-17.646,34.498-39.334,34.498c-6.458,0-12.827-1.399-18.504-4.057C18.689,71.289,14.366,73.833,9.49,73.833z M20.361,65.078l1.148,0.581c5.397,2.729,11.561,4.173,17.824,4.173c19.483,0,35.334-13.682,35.334-30.498 c0-16.818-15.851-30.5-35.334-30.5S4,22.516,4,39.334c0,6.99,2.814,13.822,7.925,19.238l0.52,0.552l0.024,0.757 c0.088,2.719-0.4,6.406-2.818,9.951c4.63-0.074,8.89-3.298,9.704-3.95L20.361,65.078z'
                 ></path>
                 <circle cx='56.489' cy='39.334' r='4.206'></circle>
                 <circle cx='39.335' cy='39.334' r='4.206'></circle>
                 <circle cx='22.177' cy='39.334' r='4.206'></circle>
              </g>
           </svg>
           <span style='color: ${icon_text_color}; margin-left: 10px;' class='ml-1 mt-1'> ${icon_text}</span>`;
      break;
    default:
  }
  return icon_html;
}

function processShowDialog(object) {
  FB.CustomerChat.show();
  object.css("max-height", "100%");
  object
    .removeClass("fb_customer_chat_bounce_out_v2")
    .addClass("fb_customer_chat_bounce_in_v2");
}

function processHideDialog(object) {
  FB.CustomerChat.show();
  object.css("max-height", "0px");
  object
    .removeClass("fb_customer_chat_bounce_in_v2")
    .addClass("fb_customer_chat_bounce_out_v2");
}

function findHighestZIndex(elem) {
  var elems = document.getElementsByTagName(elem);
  var highest = 0;
  for (var i = 0; i < elems.length; i++) {
    var zindex = document.defaultView
      .getComputedStyle(elems[i], null)
      .getPropertyValue("z-index");
    if (zindex > highest && zindex != "auto") {
      highest = zindex;
    }
  }
  return highest;
}

function parseQuery(query) {
  var Params = new Object();
  if (!query) return Params; // return empty object
  var Pairs = query.split(/[;&]/);
  for (var i = 0; i < Pairs.length; i++) {
    var KeyVal = Pairs[i].split("=");
    if (!KeyVal || KeyVal.length != 2) continue;
    var key = unescape(KeyVal[0]);
    var val = unescape(KeyVal[1]);
    val = val.replace(/\+/g, " ");
    Params[key] = val;
  }
  return Params;
}
