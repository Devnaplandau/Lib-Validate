function Validate(formSelector) {
  // cách ES5
  // if (!options) {
  //   options = {};
  // }
  var _this = this;
  // this hiện tại là của Validate
  // lưu nó vào biến _this để dễ sử dụng

  function getParents(element, selector) {
    // tối nay làm thử = closest
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  // chứa các rules cho các trường cần validate
  var formRules = {};
  // tạo 1 func trùng tên với các rules
  // - qui ước:
  // * lỗi => error message;
  // * không lỗi thì retuen => undefine;
  var validatorRules = {
    // các rules
    required: function (value) {
      return value ? undefined : "Vui lòng nhập trường này";
    },
    min: function (min) {
      return function (vale) {
        return vale.length >= min
          ? undefined
          : `Vui lòng nhập ít nhất ${min} ký tự`;
      };
    },
    max: function (max) {
      return function (vale) {
        return vale.length <= max
          ? undefined
          : `Vui lòng không vượt quá ${max} ký tự`;
      };
    },
    email: function (value) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : "Vui lòng nhập trường này";
    },
  };

  // get element from DOM equal formSelector
  var formElement = document.querySelector(formSelector);
  // xử lý khi có element trong DOM
  if (formElement) {
    var inputs = formElement.querySelectorAll("input[name][rules]");
    // tách chuỗi thành mảng
    for (var input of inputs) {
      // console.log(input.getAttribute("rules"));
      var rules = input.getAttribute("rules").split("|");
      // duyệt qua mảng được tách ở trên
      for (var rule of rules) {
        var ruleInfo;
        var isRuleHasValue = rule.includes(":");
        if (isRuleHasValue) {
          ruleInfo = rule.split(":");
          rule = ruleInfo[0]; // expect : min
          // ruleInfo[1]  expect : 6
        }
        var ruleFunc = validatorRules[rule];
        if (isRuleHasValue) {
          ruleFunc = ruleFunc(ruleInfo[1]);
        }
        // kiểm tra nó có phải là mảng k, do lần đầu là obj nên sẽ vào đk 2
        // những lần sau thì nó sẽ tự push vào thêm
        if (Array.isArray(formRules[input.name])) {
          formRules[input.name].push(ruleFunc);
        } else {
          formRules[input.name] = [ruleFunc];
        }
      }

      // lắng nghe sk để validate ( blur, change)
      input.onblur = handleValidate;
      input.oninput = handleClearError;
    }
    // hàm thực hiện validate
    function handleValidate(e) {
      var rules = formRules[e.target.name];
      var errorMessage;
      for (var rule of rules) {
        // console.log(rule);
        // rule là các func được lấy ra từ name trong obj formRules
        errorMessage = rule(e.target.value);
        if (errorMessage) {
          var formGroup = getParents(e.target, ".form-group");
          if (formGroup) {
            var formMessage = formGroup.querySelector(".form-message");
            if (formMessage) {
              formGroup.classList.add("invalid");
              formMessage.innerText = errorMessage;
            }
          }
          break;
        }
        return !errorMessage;
      }
    }
    // hàm thực hiện clear Error
    function handleClearError(event) {
      var formGroup = getParents(event.target, ".form-group");
      if (formGroup.classList.contains("invalid")) {
        formGroup.classList.remove("invalid");
      }
      var formMessage = formGroup.querySelector(".form-message");
      if (formMessage) {
        formMessage.innerText = "";
      }
    }
    // console.log(formRules);
  }
  // lắng nghe sk submit
  formElement.onsubmit = function (e) {
    e.preventDefault();
    // console.log(_this);
    // this.onSubmit();

    var inputs = formElement.querySelectorAll("input[name][rules]");
    var isValid = true;
    for (var input of inputs) {
      // console.log(input.name);
      if (!handleValidate({ target: input })) {
        isValid = false;
      }
      // explain cause of using {target: input}
      // bởi vì ở trong hàm handleValidate có : var rules = formRules[e.target.name];
      // vì vậy truyển vào 1 obj thì nó sẽ fix được lỗi target
      // code sẽ như vầy : var rules = formRules[{target:input}.target.name];
      // tử obj lấy giá trị target sẽ nhận đc value là input => input.name
    }
    if (isValid) {
      if (typeof _this.onSubmit === "function") {
        var enableInputs = formElement.querySelectorAll(
          "[name]:not([disabled])"
        );
        var formValues = Array.from(enableInputs).reduce((values, input) => {
          // xử lý lấy value Radio, checkbox
          switch (input.type) {
            case "radio":
              values[input.name] = formElement.querySelector(
                'input[name="' + input.name + '"]:checked'
              ).value;
              // if (input.matches(":checked")) {
              //   values[input.name] = input.value;
              //   console.log(values);
              // } else {
              //   values[input.name] = "";
              // }
              break;
            case "checkbox":
              // console.log(input.value);
              if (!input.matches(":checked")) return values;

              if (!Array.isArray(values[input.name])) {
                values[input.name] = [];
              }
              values[input.name].push(input.value);

              break;

            case "file":
              values[input.name] = input.files;
              break;
            default:
              values[input.name] = input.value;
          }
          return values;
        }, {});

        // gọi lại hàm onSubmit và trả về gtri của form
        _this.onSubmit(formValues);
      } else {
        formElement.submit();
      }
    }
    // console.log(isValid);
  };
}
