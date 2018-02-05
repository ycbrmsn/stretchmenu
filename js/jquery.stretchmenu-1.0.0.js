/**
 * 左侧伸展导航菜单
 * @auto jzw
 * @version 1.0.0
 * @history
 *   1.0.0 完成导航菜单基本功能
 */
;(function (factory) {
  if (typeof define === "function" && define.amd) {
    // AMD模式
    define([ "jquery" ], factory);
  } else {
    // 全局模式
    factory(jQuery);
  }
}(function ($) {
  $.fn.stretchmenu = function (options) {
    var defaultOption = {
      menuTop: 60, // 菜单的头部位置
      menuWidth: 200, // 一级菜单的宽度
      subMenuMaxShowSize: 7, // 子菜单最多显示项数
      menuItemHeight: 40, // 菜单项高度
      menuItemFontSize: 16, // 菜单项字体大小
      menuItemMaxSize: 7, // 菜单项最大中文字数
      menuItemHeightFirstLevel: 40, // 一级菜单项高度，为0时与menuItemHeight相同
      menuItemHeightSecondLevel: 35, // 二级菜单项高度，为0时与menuItemHeight相同
      menuItemHeightThirdLevel: 30, // 三级菜单项高度，为0时与menuItemHeight相同
      menuItemFontSizeFirstLevel: 0, // 一级菜单的字体大小，为0时与menuItemFontSize相同
      menuItemFontSizeSecondLevel: 0, // 二级菜单项字体大小，为0时与menuItemFontSize相同
      menuItemFontSizeThirdLevel: 0, // 三级菜单项字体大小，为0时与menuItemFontSize相同
      menuItemMaxSizeFirstLevel: 0, // 一级菜单项最大中文字数，为0时与menuItemMaxSize相同
      menuItemMaxSizeSecondLevel: 0, // 二级菜单项最大中文字数，为0时与menuItemMaxSize相同
      menuItemMaxSizeThirdLevel: 0, // 三级菜单项最大中文字数，为0时与menuItemMaxSize相同
      // menuItemBgColorFirstLevel: '#2F4056', // 一级菜单背景颜色
      // menuItemBgColorSecondLevel: '#2F4056', // 二级菜单背景颜色
      // menuItemBgColorThirdLevel: '#2F4056', // 三级菜单背景颜色
      // menuItemActiveBgColorFirstLevel: '#415977', // 一级菜单选中时的背景颜色
      // menuItemActiveBgColorSecondLevel: '#6e8cb0', // 二级菜单选中时的背景颜色
      // menuItemActiveBgColorThirdLevel: '#6e8cb0', // 三级菜单选中时的背景颜色
      menuScrollPannel: 30, // 滚动按钮栏的高度
      moreIconWidth: 10, // 更多图标的大小
      moreIconRight: 25, // 更多图标距离右边的距离
      ellipticalChars: '...', // 超出字数时显示的省略标志
      clickMenu: function (data, e) {
        console.log(data);
      }, // 菜单点击事件
      data: [
        {
          title: '一级菜单一',
          children: [
            {
              title: '二级菜单一',
              children: [
                {
                  title: '三级菜单一'
                }
              ]
            }
          ]
        },
        {
          title: '一级菜单二',
          children: [
            {
              title: '二级菜单一',
              children: [
                {
                  title: '三级菜单一'
                }
              ]
            }
          ]
        }
      ],
      a: ''
    }
    var opt = $.extend(defaultOption, options);
    // 补全opt中的缺省值
    completOpt(opt, ['menuItemHeight', 'menuItemFontSize', 'menuItemMaxSize']);
    return this.each(function () {
      var $root = $(this);
      // 初始化
      init($root, opt);
    });
  }

  /**
   * 补全opt中的缺省值
   * @param  {[type]} opt   [description]
   * @param  {[type]} attrs [description]
   * @return {[type]}       [description]
   */
  function completOpt(opt, attrs) {
    opt.levels = ['FirstLevel', 'SecondLevel', 'ThirdLevel', 'ForthLevel'];
    for (var i = 0; i < attrs.length; i++) {
      var element = attrs[i];
      for (var j = 0; j < opt.levels.length; j++) {
        var level = opt.levels[j];
        if (!opt[element + level]) {
          opt[element + level] = opt[element];
        }
      }
    }
    // 存储延迟器
    opt.menuTimeoutObj = {};
    // 计算菜单超长后的省略字符换算成中文的长度
    var ellipticalLength = Math.ceil(covertToZhTextLength(opt.ellipticalChars));
    opt.ellipticalLength = ellipticalLength;
  }

  /**
   * 初始化
   * @param  {[type]} $root [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function init($root, opt) {
    // 初始化数据
    initData($root, opt);
    // 初始化节点
    initDoms($root, opt);
    // 初始化样式
    initStyles($root, opt);
    // 初始化事件
    initEvents($root, opt);
  }

  function initData($root, opt) {
    $root.data('menuTimeoutObj', {
      activeMenuItems: [],
      visibleMenuItems: []
    });
  }

  /**
   * 初始化节点
   * @param  {[type]} $root [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function initDoms($root, opt) {
    // 计算滚动条宽度
    // 创建会出现滚动条的节点
    $root.append('<div class="stretchmenu-scroll__box"><div class="stretchmenu-scroll__container"></div></div>');
    var scrollWidth = $('.stretchmenu-scroll__box').width() - $('.stretchmenu-scroll__container').width();
    if (!scrollWidth) {
      scrollWidth = 17;
      console.log('滚动条默认17px');
    }
    opt.scrollWidth = scrollWidth;
    // 清空节点
    $root.empty();

    var d1 = new Date().getTime();
    $root.append(getListStr(opt.data, null, opt));
    var d2 = new Date().getTime();
    // console.log('构造节点耗时: ' + (d2 - d1));

    // 初始化菜单高度
    initMenuHeight($root, opt);

    // 判断一级菜单是否超过最大高度，即是否会出现滚动条
    var showMenuItemSize = Math.floor($root.height() / opt.menuItemHeightFirstLevel);
    var $menuListShow = $root.find('.stretchmenu-list__firstlevel.stretchmenu-list__visible');
    if (showMenuItemSize < opt.data.length) {
      // 如果显示的一级菜单项数少于总的一级菜单项数
      // 列表调整高度
      $menuListShow.css({
        'height': $menuListShow.parent().height() - opt.menuScrollPannel + 'px'
      });
      // 显示滚动按钮
      $menuListShow.next().show();

      // 调整更多图标的位置
      $menuListShow.find('.stretchmenu-more').css({
        'top': (opt.menuItemHeightFirstLevel - opt.moreIconWidth) / 2 + 'px',
        'right': opt.moreIconRight - opt.scrollWidth + 'px'
      });

      $root.children('.stretchmenu-list__firstlevel').attr({
        'overMaxHeight': 'true',
        'showMenuItemSize': showMenuItemSize
      });
    } else {
      // 调整更多图标的位置
      $menuListShow.find('.stretchmenu-more').css({
        'top': (opt.menuItemHeightFirstLevel - opt.moreIconWidth) / 2 + 'px',
        'right': opt.moreIconRight + 'px'
      });
    }

    // 各个菜单项的高度记录在list中
    $('.stretchmenu-list__firstlevel').attr({
      'menuItemHeight': opt.menuItemHeightFirstLevel
    }).data('menuItemHeight', opt.menuItemHeightFirstLevel);
    $('.stretchmenu-list__secondlevel').attr({
      'menuItemHeight': opt.menuItemHeightSecondLevel
    }).data('menuItemHeight', opt.menuItemHeightSecondLevel);
    $('.stretchmenu-list__thirdlevel').attr({
      'menuItemHeight': opt.menuItemHeightThirdLevel
    }).data('menuItemHeight', opt.menuItemHeightThirdLevel);
  }

  /**
   * 递归构造html
   * @param  {[type]} data  [description]
   * @param  {[type]} level [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function getListStr(data, level, opt) {
    var levelCamel;
    if (!level) {
      level = 'firstlevel';
      levelCamel = 'FirstLevel';
    } else if (level == 'firstlevel') {
      level = 'secondlevel';
      levelCamel = 'SecondLevel';
    } else if (level == 'secondlevel') {
      level = 'thirdlevel';
      levelCamel = 'ThirdLevel';
    }
    var sb = '<dl class="stretchmenu-list stretchmenu-list__' + level + ' stretchmenu-list__hidden">';
    for (var i = 0; i < data.length; i++) {
      var element = data[i];
      sb += '<dd class="stretchmenu-item stretchmenu-item__' + level + '" style="display: none;">';

      var shortTitle = getShortTitle(element.title, levelCamel, opt);
      if (shortTitle) {
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '" title="' + element.title + '">' + shortTitle + '</a>';
      } else {
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '">' + element.title + '</a>';
      }
      // sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '">' + element.title + '</a>';

      // sb += '<div class="stretchmenu-line stretchmenu-line__a"></div><div class="stretchmenu-line stretchmenu-line__b"></div>';
      if (element.children && element.children.length) {
        sb += getListStr(element.children, level, opt);
      }
      sb += '</dd>';
    }
    // var d2 = new Date().getTime();
    // console.log(d2 - d1);
    sb += '<dt class="stretchmenu-curtain"></dt>';
    sb += '</dl>';

    sb += '<div class="stretchmenu-list__visiblebox">'
    sb += '<dl class="stretchmenu-list stretchmenu-list__' + level + ' stretchmenu-list__visible">';
    for (var i = 0; i < data.length; i++) {
      var element = data[i];
      sb += '<dd class="stretchmenu-item stretchmenu-item__' + level + ' stretchmenu-item__visible">';

      var shortTitle = getShortTitle(element.title, levelCamel, opt);
      if (shortTitle) {
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '" title="' + element.title + '">' + shortTitle + '</a>';
      } else {
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '">' + element.title + '</a>';
      }

      sb += '<div class="stretchmenu-line stretchmenu-line__a"></div><div class="stretchmenu-line stretchmenu-line__b"></div>';
      if (element.children && element.children.length) {
        sb += '<div class="stretchmenu-more">';
        sb += '<div class="stretchmenu-more__top"></div><div class="stretchmenu-more__bottom"></div>';
        sb += '</div>';
      }
      sb += '</dd>';
    }
    sb += '<dt class="stretchmenu-curtain"></dt>';
    sb += '</dl>';
    sb += '<div class="stretchmenu-slidebox">'
          // + '<div class="stretchmenu-slideboxline"></div>'
          + '<a class="stretchmenu-scrollbtn stretchmenu-scrollbtn__up stretchmenu-scrollbtn__upoff"></a>'
          + '<a class="stretchmenu-scrollbtn stretchmenu-scrollbtn__down stretchmenu-scrollbtn__downon"></a>'
        + '</div>'
    sb += '<div class="stretchmenu-menuline"></div>';
    sb += '</div>';
    return sb;
  }

  function getShortTitle(title, levelCamel, opt) {
    // 判断title是否超长
    var title = title.replace(/^\s*/g, '').replace(/\s*$/g, '');
    var shortTitle = '';
    // 换算为中文后的字数
    var textLength = covertToZhTextLength(title);
    // 如果字数大于最大字数，则简单处理
    if (textLength > opt['menuItemMaxSize' + levelCamel]) {
      shortTitle = title.substring(0, opt['menuItemMaxSize' + levelCamel] - opt.ellipticalLength) + opt.ellipticalChars;
    }
    return shortTitle;
  }

  /**
   * 初始化样式
   * @param  {[type]} $root [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function initStyles($root, opt) {
    // 初始节点加上样式
    $root.addClass('stretchmenu');
    // 一级菜单背景
    $root.css({
      'width': opt.menuWidth + 'px'
      // 'backgroundColor': opt.menuItemBgColorFirstLevel
    });
    // 一级菜单列表样式
    $root.find('.stretchmenu-list__visible').css({
      'width': opt.menuWidth + opt.scrollWidth + 'px'
    });

    // 一级菜单项样式
    initItemStyles($root, opt, 'FirstLevel');
    // 二级菜单项样式
    initItemStyles($root, opt, 'SecondLevel');
    // 三级菜单项样式
    initItemStyles($root, opt, 'ThirdLevel');
    // 二级菜单栏的样式
    initListStyles($root.find('.stretchmenu-list__secondlevel'));
    // 三级菜单栏的样式
    initListStyles($root.find('.stretchmenu-list__thirdlevel'));

    // 更多图标样式，图标大小20x20
    var iconWidth = 10;
    var moreIconMarginRight = 20;
    // $root.find('.stretchmenu-item__firstlevel > .stretchmenu-more__top').css({
    //   'top': (opt.menuItemHeightFirstLevel - iconWidth) / 2 + 'px',
    //   'right': moreIconMarginRight + iconWidth / 2 + 'px',
    //   'height': iconWidth + 'px'
    // });
    // $root.find('.stretchmenu-item__secondlevel > .stretchmenu-more__top').css({
    //   'top': (opt.menuItemHeightSecondLevel - iconWidth) / 2 + 'px',
    //   'right': moreIconMarginRight + iconWidth / 2 + 'px',
    //   'height': iconWidth + 'px'
    // });
    // $root.find('.stretchmenu-item__thirdlevel > .stretchmenu-more__top').css({
    //   'top': (opt.menuItemHeightThirdLevel - iconWidth) / 2 + 'px',
    //   'right': moreIconMarginRight + iconWidth / 2 + 'px',
    //   'height': iconWidth + 'px'
    // });
    // $root.find('.stretchmenu-item__firstlevel > .stretchmenu-more__bottom').css({
    //   'top': (opt.menuItemHeightFirstLevel - iconWidth) / 2 + iconWidth + 'px',
    //   'right': moreIconMarginRight + 'px',
    //   'width': iconWidth + 'px'
    // });
    // $root.find('.stretchmenu-item__secondlevel > .stretchmenu-more__bottom').css({
    //   'top': (opt.menuItemHeightSecondLevel - iconWidth) / 2 + iconWidth + 'px',
    //   'right': moreIconMarginRight + 'px',
    //   'width': iconWidth + 'px'
    // });
    // $root.find('.stretchmenu-item__thirdlevel > .stretchmenu-more__bottom').css({
    //   'top': (opt.menuItemHeightThirdLevel - iconWidth) / 2 + iconWidth + 'px',
    //   'right': moreIconMarginRight + 'px',
    //   'width': iconWidth + 'px'
    // });
  }

  /**
   * 初始化菜单项的样式
   * @param  {[type]} $root [description]
   * @param  {[type]} opt   [description]
   * @param  {[type]} level [description]
   * @return {[type]}       [description]
   */
  function initItemStyles($root, opt, level) {
    var classLevel = level.toLowerCase();
    $root.find('.stretchmenu-a__' + classLevel).css({
      'height': opt['menuItemHeight' + level] + 'px',
      'lineHeight': opt['menuItemHeight' + level] + 'px',
      'fontSize': opt['menuItemFontSize' + level] + 'px'
      // 'backgroundColor': opt['menuItemBgColor' + level]
    });
  }

  /**
   * 初始化菜单栏的式样
   * @param  {[type]} $menuList [description]
   * @return {[type]}           [description]
   */
  function initListStyles($menuList, isOver) {
    // $menuList.css({
    //   'width': '0px',
    //   'height': '1px',
    //   'right': '0px',
    //   'overflow': 'hidden'
    // });
    // if (isOver === true) {
    //   $menuList.css({
    //     'bottom': '0px'
    //   });
    // } else if (isOver === false) {
    //   $menuList.css({
    //     'top': '0px'
    //   });
    // }
  }

  /**
   * 初始化事件
   * @param  {[type]} $root [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function initEvents($root, opt) {
    // 一级菜单移入事件
    var menuTimeoutObj = {};
    $root.off('mouseenter', '.stretchmenu-item__firstlevel.stretchmenu-item__visible')
      .on('mouseenter', '.stretchmenu-item__firstlevel.stretchmenu-item__visible', function (e) {
      // console.log('enter 1');
      var $item = $(this);
      // $item.children('.stretchmenu-a').css({
      //   'backgroundColor': opt.menuItemActiveBgColorFirstLevel
      // });
      addMenuHoverStyle($item);
      enterMenuAnimation($item, opt);

      // var $theItem = $item.parent().parent().prev().children().eq($item.index());
      // showMenuOnTime2($root, $item, opt, 'SecondLevel');
      
      judgeMenuHoverState($root, this, opt, 'SecondLevel', true); 
    });
    // 一级菜单移出事件
    $root.off('mouseleave', '.stretchmenu-item__firstlevel.stretchmenu-item__visible')
      .on('mouseleave', '.stretchmenu-item__firstlevel.stretchmenu-item__visible', function (e) {
      // console.log('leave 1');
      var $item = $(this);
      // $item.children('.stretchmenu-a').css({
      //   'backgroundColor': opt.menuItemBgColorFirstLevel
      // });
      removeMenuHoverStyle($item);
      leaveMenuAnimation($item, opt);

      // var $theItem = $item.parent().parent().prev().children().eq($item.index());
      // hideMenuOnTime2($theItem, opt, 'SecondLevel');
      
      judgeMenuHoverState($root, this, opt, 'SecondLevel', false);
    });

    // 二级菜单移入事件
    var secondMenuTimeout;
    $root.off('mouseenter', '.stretchmenu-item__secondlevel.stretchmenu-item__visible')
      .on('mouseenter', '.stretchmenu-item__secondlevel.stretchmenu-item__visible', function (e) {
      // console.log('enter 2');
      var $item = $(this);
      // $item.children('.stretchmenu-a').css({
      //   'backgroundColor': opt.menuItemActiveBgColorSecondLevel
      // });
      addMenuHoverStyle($item);
      enterMenuAnimation($item, opt);

      // var $theItem = $item.parent().parent().prev().children().eq($item.index());
      // showMenuOnTime2($root, $item, opt, 'ThirdLevel');
      judgeMenuHoverState($root, this, opt, 'ThirdLevel', true);
    });
    // 二级菜单移出事件
    $root.off('mouseleave', '.stretchmenu-item__secondlevel.stretchmenu-item__visible')
      .on('mouseleave', '.stretchmenu-item__secondlevel.stretchmenu-item__visible', function (e) {
      // console.log('leave 2');
      var $item = $(this);
      // $(this).children('.stretchmenu-a').css({
      //   'backgroundColor': opt.menuItemBgColorSecondLevel
      // });
      removeMenuHoverStyle($item);
      leaveMenuAnimation($(this), opt);

      // var $theItem = $item.parent().parent().prev().children().eq($item.index());
      // hideMenuOnTime2($theItem, opt, 'ThirdLevel');
      judgeMenuHoverState($root, this, opt, 'ThirdLevel', false);
    });

    // 三级菜单移入事件
    $root.off('mouseenter', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible')
      .on('mouseenter', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible', function (e) {
      // console.log('enter 3');
      var $item = $(this);
      // $(this).children('.stretchmenu-a').css({
      //   'backgroundColor': opt.menuItemActiveBgColorThirdLevel
      // });
      addMenuHoverStyle($item);
      enterMenuAnimation($(this), opt);
      // showMenuOnTime2(null, null, opt, 'ForthLevel');
      
      judgeMenuHoverState($root, this, opt, 'ForthLevel', true);
    });
    // 三级菜单移出事件
    $root.off('mouseleave', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible')
      .on('mouseleave', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible', function (e) {
      // console.log('leave 3');
      var $item = $(this);
      // $(this).children('.stretchmenu-a').css({
      //   'backgroundColor': opt.menuItemBgColorThirdLevel
      // });
      removeMenuHoverStyle($item);
      leaveMenuAnimation($(this), opt);

      judgeMenuHoverState($root, this, opt, 'ForthLevel', false);
    });

    // 菜单项点击事件
    $root.off('click', '.stretchmenu-item').on('click', '.stretchmenu-item', function (e) {
      e.stopPropagation();
      if (typeof opt.clickMenu === 'function') {
        var data = getMenuItemData($(this), opt);
        opt.clickMenu(data, e);
      }
    });

    // 滚动按钮栏移入移出事件
    $root.off('mouseenter', '.stretchmenu-slidebox').on('mouseenter', '.stretchmenu-slidebox', function (e) {
      var menuTimeoutObj = $root.data('menuTimeoutObj');
      if (menuTimeoutObj.menuHover) {
        clearTimeout(menuTimeoutObj.menuHover);
      }
      menuTimeoutObj.mouseLocation = 'scrollPannel';
    });
    $root.off('mouseleave', '.stretchmenu-slidebox').on('mouseleave', '.stretchmenu-slidebox', function (e) {
      var menuTimeoutObj = $root.data('menuTimeoutObj');
      if (menuTimeoutObj.menuHover) {
        clearTimeout(menuTimeoutObj.menuHover);
      }
      menuTimeoutObj.mouseLocation = '';
      menuTimeoutObj.menuHover = setTimeout(menuTimeoutObj.menuHoverFunc, 500);
    });

    // 滚动按钮滚动事件
    $root.off('click', '.stretchmenu-scrollbtn__up').on('click', '.stretchmenu-scrollbtn__up', function (e) {
      scrollMenu(this, 'up', opt);
    });
    $root.off('click', '.stretchmenu-scrollbtn__down').on('click', '.stretchmenu-scrollbtn__down', function (e) {
      scrollMenu(this, 'down', opt);
    });
    // 阻止滚动栏点击冒泡
    $root.off('click', '.stretchmenu-slidebox').on('click', '.stretchmenu-slidebox', function (e) {
      e.stopPropagation();
    });

    var $menuList = $root.find('.stretchmenu-list');
    // 菜单滚动时显示遮罩清空延时器
    $menuList.scroll(function (e) {
      // if (secondMenuTimeout) {
      //   clearTimeout(secondMenuTimeout);
      //   console.log('clear')
      // }
      $(this).children('.stretchmenu-curtain:hidden').show();
      var menuTimeoutObj = $root.data('menuTimeoutObj');
      if (menuTimeoutObj.menuHover) {
        clearTimeout(menuTimeoutObj.menuHover);
      }
      if (menuTimeoutObj.mouseLocation != 'scrollPannel') {
        menuTimeoutObj.menuHover = setTimeout(menuTimeoutObj.menuHoverFunc, 500);
      }
    });
    // 滚动条移动后自动对齐
    scrollEnd($menuList, function ($this, e) {
      // 滚动条滚动的高度
      var scrollTop = $this.scrollTop();
      // 菜单项高度
      var menuItemHeight = $this.data('menuItemHeight');
      // 菜单高度
      var menuListHeight = parseInt($this.css('height'));
      if (scrollTop == 0) {
        // 滚动到了头部
        // 向上不可滚
        $this.next().children('.stretchmenu-scrollbtn__upon').removeClass('stretchmenu-scrollbtn__upon')
        .addClass('stretchmenu-scrollbtn__upoff');
        // 向下可滚
        $this.next().children('.stretchmenu-scrollbtn__downoff').removeClass('stretchmenu-scrollbtn__downoff')
        .addClass('stretchmenu-scrollbtn__downon');
      } else if (menuListHeight + scrollTop == $this.children('.stretchmenu-item').size() * menuItemHeight) {
        // 如果滚动到了底部，则不进行对齐
        // 向上可滚
        $this.next().children('.stretchmenu-scrollbtn__upoff').removeClass('stretchmenu-scrollbtn__upoff')
        .addClass('stretchmenu-scrollbtn__upon');
        // 向下不可滚
        $this.next().children('.stretchmenu-scrollbtn__downon').removeClass('stretchmenu-scrollbtn__downon')
        .addClass('stretchmenu-scrollbtn__downoff');
      } else {
        // 如果没有滚动到底部，则对齐
        if (scrollTop % menuItemHeight == 0) {
          // 已经对齐，则不操作
          // do nothing
        } else if (scrollTop % menuItemHeight < menuItemHeight / 2) {
          // 如果最上方滚动位置在一个菜单项的中部偏上，则显示出上方的菜单项
          $this.stop().animate({
            'scrollTop': Math.floor(scrollTop / menuItemHeight) * menuItemHeight + 'px'
          }, function () {
          });
          // $this.scrollTop(Math.floor(scrollTop / menuItemHeight) * menuItemHeight);
        } else {
          // 如果最上方滚动位置在一个菜单项的中部偏下，则不显示上方的菜单项，即滚动到下一个菜单项
          $this.stop().animate({
            'scrollTop': Math.ceil(scrollTop / menuItemHeight) * menuItemHeight + 'px'
          }, function () {
          });
          // $this.scrollTop(Math.ceil(scrollTop / menuItemHeight) * menuItemHeight);
        }
        $this.next().children('.stretchmenu-scrollbtn__upoff').removeClass('stretchmenu-scrollbtn__upoff')
        .addClass('stretchmenu-scrollbtn__upon');
        $this.next().children('.stretchmenu-scrollbtn__downoff').removeClass('stretchmenu-scrollbtn__downoff')
        .addClass('stretchmenu-scrollbtn__downon');
      }
      // 隐藏遮罩
      $this.children('.stretchmenu-curtain').hide();

    }, 200);

    // 调整菜单高度
    $(window).resize(function () {
      initMenuHeight($root, opt);
    });
  }

  /**
   * 初始化菜单高度
   * @param  {[type]} $root [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function initMenuHeight($root, opt) {
    var windowHeight = $(window).height();
    $root.css({
      'height': windowHeight - opt.menuTop + 'px'
    });
  }

  /**
   * 获取上一级的level，匹配不上时返回null
   * @param  {[type]} opt   [description]
   * @param  {[type]} level [包括SecondLevel，ThirdLevel]
   * @return {[type]}       [description]
   */
  function getPrevLevel(opt, level) {
    for (var i = 1; i < opt.levels.length; i++) {
      if (opt.levels[i] == level) {
        return opt.levels[i - 1];
      }
    }
    return null;
  }

  /**
   * 获取下一级的level，匹配不上时返回null
   * @param  {[type]} opt   [description]
   * @param  {[type]} level [description]
   * @return {[type]}       [description]
   */
  function getNextLevel(opt, level) {
    for (var i = opt.levels.length - 2; i >= 0; i--) {
      if (opt.levels[i] == level) {
        return opt.levels[i + 1];
      }
    }
    return null;
  }

  /**
   * 获取菜单项对应的数据
   * @param  {[type]} $menuItemShow [description]
   * @param  {[type]} opt           [description]
   * @return {[type]}               [description]
   */
  function getMenuItemData($menuItemShow, opt) {
    // 构造当前菜单及其所有上级菜单的序数数组，倒序排列
    var arrIndex = [];
    arrIndex.push($menuItemShow.index());
    $menuItemShow.parents('.stretchmenu-item').each(function (index, element) {
      var itemIndex = $(this).index();
      arrIndex.push(itemIndex);
    });
    var data;
    for (var i = arrIndex.length - 1; i >= 0; i--) {
      var dataIndex = arrIndex[i];
      if (i == arrIndex.length - 1) {
        data = opt.data[dataIndex];
      } else {
        data = data.children[dataIndex];
      }
    }
    return data;
  }

  /**
   * 展示菜单
   * @param  {[type]} $root     [description]
   * @param  {[type]} $menuList [description]
   * @param  {[type]} opt       [description]
   * @return {[type]}           [description]
   */
  function showMenu($root, $parentMenuList, $menuList, opt, level) {
    if (!$menuList.size()) {
      return false;
    }
    
    recoverMenu($parentMenuList, $menuList, 'open', level);

    // 菜单项高度
    var menuItemHeight = opt['menuItemHeight' + level];
    // 记录菜单项的高度
    $menuList.data('menuItemHeight', menuItemHeight);
    // 子菜单的最大高度
    var subMenuMaxHeight = menuItemHeight * opt.subMenuMaxShowSize;
    // 子菜单的实际宽高
    var dimension = calcMenuWidthAndHeight($menuList.children().children('.stretchmenu-a'), 
      opt['menuItemFontSize' + level], menuItemHeight, subMenuMaxHeight, opt);
    // 如果子菜单的实际高度大于最大高度，则加上移出标志，用于控制显示隐藏多余项滚动条等
    if (dimension.height > subMenuMaxHeight) {
      $menuList.attr({
        'overMaxHeight': 'true'
      });
    }

    // if (level == 'ThirdLevel') {
    //   return;
    // }

    // 如果上级菜单的实际高度大于最大高度，则隐藏不显示的其他菜单项
    if ($parentMenuList.attr('overMaxHeight')) {
      // 一级菜单会有这个值
      var showMenuItemSize = $parentMenuList.attr('showMenuItemSize');
      var menuMaxShowSize = showMenuItemSize ? parseInt(showMenuItemSize) : opt.subMenuMaxShowSize;
      // 获取滚动条的滚动高度
      var scrollTop = $parentMenuList.scrollTop();
      $parentMenuList.attr({
        'scrollTop': scrollTop
      });
      // 判断需要显示的菜单项数
      var menuShowSize;
      var menuItemHeightParent = opt['menuItemHeight' + getPrevLevel(opt, level)];
      var topDistance = scrollTop % menuItemHeightParent;
      if (topDistance == 0) {
        // 如果滚动条正好滚动对齐一项，则显示opt.subMenuMaxShowSize项
        menuShowSize = menuMaxShowSize;
      } else {
        // 如果没有对齐，则说明滚动条到底了
        menuShowSize = menuMaxShowSize;
        $parentMenuList.css({
          'paddingTop': menuItemHeightParent - topDistance + 'px'
        });
        if (level == 'SecondLevel') {
          $parentMenuList.css({
            'height': $root.height() - (menuItemHeightParent - topDistance) + 'px'
          });
        }
      }
      // 获取第一个显示完整的菜单项
      var firstShowMenuItemIndex = Math.ceil(scrollTop / menuItemHeightParent);
      var lastShowMenuItemIndex = firstShowMenuItemIndex + menuShowSize - 1;
      // 最后一个是遮罩，所以要减去
      var lastMenuItemIndex = $parentMenuList.children().size() - 2;
      $parentMenuList.children().each(function (index, element) {
        if (index < firstShowMenuItemIndex || index > lastShowMenuItemIndex) {
          $(this).hide();
        }
      });
    }

    // 子菜单显示的高度
    var menuHeight = dimension.height > subMenuMaxHeight ? subMenuMaxHeight : dimension.height;
    // 父菜单设置为visible子菜单才能无滚动条显示出来
    $parentMenuList.css({
      'overflow': 'visible'
    });


    // 记录当前选中项的高度
    var $menuItem = $menuList.parent();
    var menuIndex = getMenuItemVisibleIndex($parentMenuList, $menuItem.index());
    // 选中项与所在菜单栏的头部的距离
    var topDistance = menuItemHeight * menuIndex;
    // 取出上级菜单项的top值
    var topDistanceParent = 0;
    var $parentMenuItem = $parentMenuList.parent();
    if ($parentMenuItem.hasClass('stretchmenu')) {
      // 如果有stretchmenu类，则说明当前选中菜单项是一级菜单，则topDistanceParent为0
      
    } else {
      // 如果没有stretchmenu类，则说明当前选中菜单项是子菜单
      topDistanceParent = parseInt($parentMenuItem.attr('topDistance'));
    }
    var wholeMenuHeight = topDistanceParent + topDistance + menuHeight;
    var isOver;
    if (wholeMenuHeight > $root.height()) {
      // 如果子菜单的总高度大于一级菜单高度，则向上展开
      $menuItem.attr('topDistance', topDistanceParent + topDistance + $menuItem.height() - menuHeight);
      isOver = true;
    } else {
      // 如果子菜单的总高度小于一级菜单的高度，则向下展开
      $menuItem.attr('topDistance', topDistanceParent + topDistance)
      isOver = false;
    }
    // console.log(topDistanceParent + '-' + topDistance + '-' + $menuItem.height() + '-' + menuHeight)

    initListStyles($menuList, isOver);

    $menuList.animate({
      'width': dimension.width + 'px',
      'right': - dimension.width + 'px'
    }, 'fast', 'swing', function () {
      // 水平移动完成之后，开始垂直移动
      // 判断子菜单是否超过一级菜单底部
      if (isOver) {
        $menuList.animate({
          'height': menuHeight + 'px',
        }, 'fast', 'swing', function () {
          // 垂直移动完成之后，修改裁剪属性
          $menuList.css({
            'height': menuHeight + 'px',
            'overflow': 'auto'
          });
          // 显示子菜单前滚动条置于最上方
          $menuList.scrollTop(0);
          // console.log($menuList.attr('class') + '菜单打开完成')
        });
      } else {
        $menuList.animate({
          'height': menuHeight + 'px'
        }, 'fast', 'swing', function () {
          // 垂直移动完成之后，修改裁剪属性
          $menuList.css({
            'height': menuHeight + 'px',
            'overflow': 'auto'
          });
          // 显示子菜单前滚动条置于最上方
          $menuList.scrollTop(0);
          // console.log($menuList.attr('class') + '菜单打开完成')
        });
      }
    });
  }

  /**
   * 展示菜单
   * @param  {[type]} $root           [description]
   * @param  {[type]} $parentMenuList [description]
   * @param  {[type]} $menuList       [description]
   * @param  {[type]} opt             [description]
   * @param  {[type]} level           [description]
   * @param  {[type]} $menuListShow   [description]
   * @return {[type]}                 [description]
   */
  function showMenuList($root, $menuItemShow, opt, level) {
    // 显示的当前菜单列表
    var $currentMenuListShow = $menuItemShow.parent();
    // 隐藏的当前菜单列表
    var $currentMenuList = $currentMenuListShow.parent().prev();
    // 隐藏的当前菜单项
    var $currentMenuItem = $currentMenuList.children().eq($menuItemShow.index());
    // 隐藏的下级菜单列表
    var $menuList = $currentMenuItem.children('.stretchmenu-list__hidden');
    // 下级菜单盒子
    var $menuBox = $menuList.next();
    // 显示的下级菜单列表
    var $menuListShow = $menuBox.children('.stretchmenu-list');

    if (!$menuList.size()) {
      return false;
    }

    // **************************************调整对应菜单项的位置
    // 显示菜单的滚动的距离
    var scrollTop = $currentMenuListShow.scrollTop();
    // 显示菜单项的高度
    var menuItemHeightShow = opt['menuItemHeight' + getPrevLevel(opt, level)];
    // 正常情况下对应菜单项上方的距离
    var menuItemTop = menuItemHeightShow * $menuItemShow.index();
    // 下方菜单项实际的marginTop值
    var menuTopDistance = menuItemTop - scrollTop;
    // 显示下方对应的菜单项，隐藏其他菜单项
    $currentMenuItem.show().siblings().hide();
    // 对齐菜单项
    $currentMenuItem.css({
      'marginTop': menuTopDistance + 'px'
    });

    // ***************************************显示菜单
    
    // 下级菜单项高度
    var menuItemHeight = opt['menuItemHeight' + level];
    // 记录菜单项的高度
    $menuList.data('menuItemHeight', menuItemHeight);
    // 子菜单的最大高度
    var subMenuMaxHeight = menuItemHeight * opt.subMenuMaxShowSize;
    // 子菜单的实际宽高
    var dimension = calcMenuWidthAndHeight($menuList.children().children('.stretchmenu-a'), 
      opt['menuItemFontSize' + level], menuItemHeight, subMenuMaxHeight, opt);
    // 子菜单显示的高度
    var menuHeight = dimension.height > subMenuMaxHeight ? subMenuMaxHeight : dimension.height;
    // 如果子菜单的实际高度大于最大高度，则加上移出标志，用于控制显示隐藏多余项滚动条等
    if (dimension.height > subMenuMaxHeight) {
      $menuList.attr({
        'overMaxHeight': 'true'
      });
      // 调整显示列表高度
      $menuListShow.css({
        'height': menuHeight - opt.menuScrollPannel + 'px'
      });
      $menuListShow.next().show();

      // 有滚动条时的更多按钮的位置，略微向右调整
      $menuListShow.find('.stretchmenu-more').css({
        'top': (opt['menuItemHeight' + level] - opt.moreIconWidth) / 2 + 'px',
        'right': opt.moreIconRight - opt.scrollWidth + 'px'
      });
    } else {
      // 没有滚动条时的更多按钮的位置
      $menuListShow.find('.stretchmenu-more').css({
        'top': (opt['menuItemHeight' + level] - opt.moreIconWidth) / 2 + 'px',
        'right': opt.moreIconRight + 'px'
      });
    }

    // 记录当前选中项的高度
    var topDistance = menuItemTop;
    // 取出上级菜单项的top值
    var topDistanceParent = 0;
    var $parentMenuItem = $currentMenuList.parent();
    if ($parentMenuItem.hasClass('stretchmenu')) {
      // 如果有stretchmenu类，则说明当前选中菜单项是一级菜单，则topDistanceParent为0
      
    } else {
      // 如果没有stretchmenu类，则说明当前选中菜单项是子菜单
      topDistanceParent = parseInt($parentMenuItem.attr('topDistance')) || 0;
    }
    // 上级菜单头部位置 + 正常情况下对应菜单项上方的距离 + 子菜单高度 - 滚动高度
    var wholeMenuHeight = topDistanceParent + topDistance + menuHeight - scrollTop;
    var isOver;
    // 菜单与底部的距离
    var bottomDistance = $root.height() - wholeMenuHeight;
    // console.log(topDistanceParent + '---' + (topDistance - scrollTop) + '---' + menuHeight + '---' + bottomDistance)
    if (bottomDistance < 0) {
      isOver = true;
      // 如果子菜单的总高度大于一级菜单高度，则到达底部之后向上展开
      // 上级菜单头部位置 + (正常情况下对应菜单项上方的距离 - 滚动高度) + 距离底部的位置（负值）
      var topD = topDistanceParent + (topDistance - scrollTop) + bottomDistance;
      $currentMenuItem.attr('topDistance', topD);
    } else {
      isOver = false;
      // 如果子菜单的总高度小于一级菜单的高度，则向下展开
      // 上级菜单头部位置 + 正常情况下对应菜单项上方的距离 - 滚动高度
      $currentMenuItem.attr('topDistance', topDistanceParent + topDistance - scrollTop)
    }
    // console.log(topDistanceParent + '-' + topDistance + '-' + $menuItem.height() + '-' + menuHeight)

    // initListStyles($menuList, false);

    // 判断是否有滚动条，如果有，则显示滚动按钮
    // if (hasScroll($menuListShow)) {
    //   // 调整显示列表高度
    //   $menuListShow.css({
    //     'height': menuHeight - opt.menuScrollPannel + 'px'
    //   });
    //   $menuListShow.next().show();
    //   // 有滚动条时更新更多按钮的位置，略微向右调整
    //   // alert($menuListShow.children('.stretchmenu-more').size())
    //   $menuListShow.find('.stretchmenu-more').css({
    //     'right': '15px'
    //   });
    // }

    // 变换
    $menuBox.css({
      'top': '0px',
      'height': '1px'
    }).animate({
      'width': dimension.width + 'px',
      'right': - dimension.width + 'px'
    }, 'fast', 'swing', function () {
      // 设置列表的宽度
      $menuBox.children('.stretchmenu-list').css({
        'width': dimension.width + opt.scrollWidth + 'px'
      });
      // 下方列表的宽度
      $menuList.css({
        'width': dimension.width + 'px',
        'right': -dimension.width + 'px'
      })
      // 水平移动完成之后，开始垂直移动
      // 判断子菜单是否超过一级菜单底部
      if (isOver) {
        $menuBox.animate({
          'height': menuHeight + bottomDistance + 'px',
        }, 'fast', 'swing', function () {
          
        }).animate({
          'height': menuHeight + 'px',
          'top': bottomDistance + 'px'
        }, 'fast', 'swing', function () {
          // 垂直移动完成之后，调整下方列表的位置与高度
          $menuBox.css({
            'height': menuHeight + 'px'
          });
          $menuList.css({
            'top': bottomDistance + 'px'
          });
          // 显示子菜单前滚动条置于最上方
          $menuList.scrollTop(0);
          // console.log($menuList.attr('class') + '菜单打开完成')
        });
      } else {
        $menuBox.animate({
          'height': menuHeight + 'px'
        }, 'fast', 'swing', function () {
          // 垂直移动完成之后，修改裁剪属性
          $menuBox.css({
            'height': menuHeight + 'px'
          });
          // 显示子菜单前滚动条置于最上方
          $menuList.scrollTop(0);
          // console.log($menuList.attr('class') + '菜单打开完成')
        });
      }
    });
  }

  /**
   * 隐藏菜单
   * @param  {[type]} $parentMenuList [description]
   * @param  {[type]} $menuList       [description]
   * @param  {[type]} opt             [description]
   * @param  {[type]} level           [description]
   * @return {[type]}                 [description]
   */
  function hideMenu($parentMenuList, $menuList, opt, level) {
    if (!$menuList.size()) {
      return false;
    }
    $menuList.css({
      'overflow': 'hidden'
    });
    // 菜单还原
    $menuList.stop().animate({
      'width': '0px',
      'right': '0px'
    }, 'fast', 'swing', function () {
      recoverMenu($parentMenuList, $menuList, 'close', level);
      // console.log($menuList.attr('class') + '菜单还原完成')
    });
  }

  function hideMenuList($menuList, opt) {
    if (!$menuList.size()) {
      return false;
    }
    // 菜单还原
    var $children = $menuList.children().hide();
    // var childrenItemHeight = $children.css('height');
    // $children.css({
    //   'width': '0px'
    //   // 'height': '0px'
    // });
    $menuList.next().stop().animate({
      'width': '0px',
      'right': '0px'
    }, 'fast', 'swing', function () {

    });
  }

  function recoverMenu($parentMenuList, $menuList, flag, level) {
    if (flag == 'open') {
      // 如果是打开菜单前的恢复，则隐藏子菜单的遮罩层
      $menuList.children('.stretchmenu-curtain').hide();
    } else {
      // 如果是关闭菜单后的恢复
      var $hideMenus = $parentMenuList.children('.stretchmenu-item:hidden');
      if ($parentMenuList.attr('overMaxHeight') && $hideMenus.size()) {
        // 如果上级菜单高度超过了显示的最大高度并且有隐藏项，则显示
        $parentMenuList.css({
          'paddingTop': ''
        });
        // 一级菜单调整高度
        if (level == 'SecondLevel') {
          $parentMenuList.css({
            'height': ''
          });
        }
        $hideMenus.show();
        // $parentMenuList.scrollTop($parentMenuList.attr('scrollTop'));
        // console.log($parentMenuList.scrollTop())
        // 
      }
      $parentMenuList.css({
        'overflow': 'auto'
      });
    }
  }

  function showMenuOnTime($root, $item, opt, level) {
    var showMenuTimeout = opt.menuTimeoutObj[level + 'show'];
    if (showMenuTimeout) {
      clearTimeout(showMenuTimeout);
      // console.log('移入： ' + $item.children('a').text())
    }
    opt.menuTimeoutObj[level + 'show'] = setTimeout(function () {
      showMenu($root, $item.parent(), $item.children('.stretchmenu-list'), opt, level);
    }, 500);
  }

  function showMenuOnTime2($root, $item, opt, level) {
    // 清除打开下级菜单的延时器
    var showMenuTimeout = opt.menuTimeoutObj[level + 'show'];
    if (showMenuTimeout) {
      clearTimeout(showMenuTimeout);
      // console.log('移入： ' + $item.children('a').text())
    }
    // 清除关闭当前菜单的延时器
    var hideMenuTimeout = opt.menuTimeoutObj[getPrevLevel(opt, level) + 'hide'];
    if (hideMenuTimeout) {
      clearTimeout(hideMenuTimeout);
    }
    // 清除关闭上级菜单的延时器
    hideMenuTimeout = opt.menuTimeoutObj[getPrevLevel(opt, getPrevLevel(opt, level)) + 'hide'];
    if (hideMenuTimeout) {
      clearTimeout(hideMenuTimeout);
    }

    if ($item) {
      // 打开下级菜单
      opt.menuTimeoutObj[level + 'show'] = setTimeout(function () {
        showMenuList($root, $item, opt, level);
      }, 500);
    }
  }

  function hideMenuOnTime($item, opt, level) {
    var showMenuTimeout = opt.menuTimeoutObj[level + 'show'];
    if (showMenuTimeout) {
      clearTimeout(showMenuTimeout);
      // console.log('移出： ' + $item.children('a').text())
    }
    hideMenu($item.parent(), $item.children('.stretchmenu-list'), opt, level);
  }

  function hideMenuOnTime2($item, opt, level) {
    // 清除显示下级菜单的延时器
    var showMenuTimeout = opt.menuTimeoutObj[level + 'show'];
    if (showMenuTimeout) {
      clearTimeout(showMenuTimeout);
    }
    // 清除后打开关闭下级菜单的延时器
    if (opt.menuTimeoutObj[level + 'hide']) {
      clearTimeout(opt.menuTimeoutObj[level + 'hide']);
    }
    opt.menuTimeoutObj[level + 'hide'] = setTimeout(function () {
      hideMenuList($item.children('.stretchmenu-list'), opt);
    }, 500);
    var currentMenuLevel = getPrevLevel(opt, level);
    if (currentMenuLevel != 'FirstLevel') {
      // 如果当前菜单不是一级菜单
      // 清除后打开关闭当前菜单的延时器
      if (opt.menuTimeoutObj[currentMenuLevel + 'hide']) {
        clearTimeout(opt.menuTimeoutObj[currentMenuLevel + 'hide']);
      }
      opt.menuTimeoutObj[currentMenuLevel + 'hide'] = setTimeout(function () {
        hideMenuList($item.parent(), opt);
      }, 500);
    }

    // 打开关闭所有下级菜单的延时器
    var levelNext = level;
    // alert(levelNext = getPrevLevel(opt, levelNext))
    // while (levelNext = getNextLevel(opt, levelNext)) {
    //   $item = $item.children('.stretchmenu-list').parent();
    //   opt.menuTimeoutObj[levelNext + 'hide'] = setTimeout(function () {
    //     hideMenuList($item.parent(), $item.children('.stretchmenu-list'), opt);
    //   }, 500);
    // }
  }

  function borderRun($item, opt) {
    var $lineA = $item.children('.stretchmenu-line__a');
    var $lineB = $item.children('.stretchmenu-line__b');
    $lineA.stop().css({
      'top': '0px',
      'bottom': '',
      'left': '0px',
      'right': '',
      'width': '1px',
      'height': '1px'
    }).show().animate({
      'width': '100%'
    }, function () {
      $(this).css({
        'left': '',
        'right': '0px'
      }).animate({
        'width': '1px'
      }).animate({
        'height': '100%'
      }, function () {
        $(this).css({
          'top': '',
          'bottom': '0px'
        }).animate({
          'height': '1px'
        }, function () {
          $(this).hide();
        });
      });
    });
    $lineB.stop().css({
      'top': '',
      'bottom': '0px',
      'left': '',
      'right': '0px',
      'width': '1px',
      'height': '1px'
    }).show().animate({
      'width': '100%'
    }, function () {
      $(this).css({
        'left': '0px',
        'right': ''
      }).animate({
        'width': '1px'
      }).animate({
        'height': '100%'
      }, function () {
        $(this).css({
          'top': '0px',
          'bottom': ''
        }).animate({
          'height': '1px'
        }, function () {
          $(this).hide();
        });
      });
    });
  }

  function borderStop($item, opt) {
    $item.children('.stretchmenu-line').hide().stop();
  }

  function activeMoreMenuItem($menuItemShow) {
    var $moreTop = $menuItemShow.find('.stretchmenu-more__top');
    var $moreBottom = $menuItemShow.find('.stretchmenu-more__bottom');
    // $moreTop.css({
    //   'width': '100%',
    //   'height': '1px'
    // });
    $moreTop.stop().animate({
      'width': '1px'
    }, 'fast').animate({
      'height': '100%'
    }, 'fast');
    // $moreBottom.css({
    //   'width': '1px',
    //   'height': '100%'
    // });
    $moreBottom.stop().animate({
      'height': '1px'
    }, 'fast').animate({
      'width': '100%'
    }, 'fast');
  }

  function recoverMoreMenuItem($menuItemShow) {
    var $moreTop = $menuItemShow.find('.stretchmenu-more__top');
    var $moreBottom = $menuItemShow.find('.stretchmenu-more__bottom');
    // $moreTop.css({
    //   'width': '1px',
    //   'height': '100%'
    // })
    $moreTop.stop().animate({
      'height': '1px'
    }, 'fast').animate({
      'width': '100%'
    }, 'fast');
    // $moreBottom.css({
    //   'width': '100%',
    //   'height': '1px'
    // })
    $moreBottom.stop().animate({
      'width': '1px'
    }, 'fast').animate({
      'height': '100%'
    }, 'fast');
  }

  /**
   * 进入菜单的选中动画效果
   * @param  {[type]} $item [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function enterMenuAnimation($item, opt) {
    var enterInterval = $item.data('enter');
    if (enterInterval) {
      clearInterval(enterInterval);
    }
    borderRun($item, opt);
    $item.data('enter', setInterval(function () {
      borderRun($item, opt);
    }, 4000));
  }

  /**
   * 离开菜单清除选中动画效果
   * @param  {[type]} $item [description]
   * @param  {[type]} opt   [description]
   * @return {[type]}       [description]
   */
  function leaveMenuAnimation($item, opt) {
    var enterInterval = $item.data('enter');
    if (enterInterval) {
      clearInterval(enterInterval);
    }
    borderStop($item, opt);
  }

  /**
   * 进入菜单项
   * @param  {[type]} $root         [description]
   * @param  {[type]} $menuItemShow [description]
   * @param  {[type]} opt           [description]
   * @param  {[type]} level         [description]
   * @return {[type]}               [description]
   */
  function enterMenuItem($root, $menuItemShow, opt, level) {
    // 显示下级菜单
    showMenuList($root, $menuItemShow, opt, level)
    // 设置菜单选中状态
    setMenuActive($root, $menuItemShow, opt)
  }

  /**
   * 离开菜单项
   * @param  {[type]} $root         [description]
   * @param  {[type]} $menuItemShow [description]
   * @param  {[type]} opt           [description]
   * @return {[type]}               [description]
   */
  function leaveMenuItem($root, $menuItemShow, opt) {
    // console.log('leave')
    var $currentMenuList = $menuItemShow.parent().parent().prev();
    // var $menuList = $currentMenuList.children().eq($menuItemShow.index()).children('.stretchmenu-list');
    // 隐藏所有下级菜单，效率太低
    // $menuList.parent().find('.stretchmenu-list__hidden > .stretchmenu-item:visible').each(function () {
    //   hideMenuList($(this).children('.stretchmenu-list'), opt);
    // });
    // 隐藏所有下级菜单
    // 通过选中的菜单去隐藏
    // 因为选中数组是从最下层添加进去的，所以只要比对到相同时，就可以开始隐藏了
    var menuTimeoutObj = $root.data('menuTimeoutObj');
    var activeMenuItems = menuTimeoutObj.activeMenuItems;
    var isBegin = false;
    for (var i = activeMenuItems.length - 1; i >= 0; i--) {
      if (!isBegin) {
        if ($menuItemShow.get(0) == activeMenuItems[i].get(0)) {
          isBegin = true
        }
      }
      if (isBegin) {
        var itemIndex = activeMenuItems[i].index();
        var $menuList = activeMenuItems[i].parent().parent().prev().children().eq(itemIndex).children('.stretchmenu-list');
        hideMenuList($menuList, opt);
      }
    }
  }

  /**
   * 判断菜单状态，决定菜单的显示隐藏效果
   * @param  {[type]}  $root   [description]
   * @param  {[type]}  item    [description]
   * @param  {[type]}  opt     [description]
   * @param  {[type]}  level   [description]
   * @param  {Boolean} isEnter [description]
   * @return {[type]}          [description]
   */
  function judgeMenuHoverState($root, item, opt, level, isEnter) {
    var menuTimeoutObj = $root.data('menuTimeoutObj');
    if (menuTimeoutObj.menuHover) {
      clearTimeout(menuTimeoutObj.menuHover);
    }
    menuTimeoutObj.menuHoverFunc = function () {
      if (isEnter) {
        // 如果最后一个状态是移入菜单
        if (!menuTimeoutObj.lastMenuState) {
          // 上一个状态是移出
          enterMenuItem($root, $(item), opt, level);
        } else if (item !== menuTimeoutObj.lastMenu) {
          // 如果上一个状态是移入状态且当前菜单项与上一个菜单项不同时
          if (level === menuTimeoutObj.lastMenuLevel) {
            // console.log('上一个菜单项与当前菜单项同级')
            // 如果上一个菜单项与当前菜单项同级
            // 则先隐藏上一个菜单项的下级菜单，然后显示对应下级菜单
            leaveMenuItem($root, $(menuTimeoutObj.lastMenu), opt);
            enterMenuItem($root, $(item), opt, level);
          } else if (isParentsMenuPrev(menuTimeoutObj.lastMenuLevel, level, opt)) {
            // console.log('上一个菜单项是当前菜单项的上级')
            // 如果上一个菜单项是上级菜单，则直接显示当前菜单项的下级菜单
            enterMenuItem($root, $(item), opt, level);
          } else {
            // console.log('上一个菜单项是当前菜单项的下级')
            // 如果上一个菜单项是下级菜单，则隐藏当前菜单项级数之下的所有菜单，显示当前菜单项的下级菜单
            // stretchmenu-item__firstlevel
            var currentMenuLevel = getPrevLevel(opt, level);
            var currentMenuClass = 'stretchmenu-item__' + currentMenuLevel.toLowerCase();
            var activeMenuItems = menuTimeoutObj.activeMenuItems;
            for (var i = 0; i < activeMenuItems.length; i++) {
              if (activeMenuItems[i].hasClass(currentMenuClass)) {
                // 如果选中菜单的class与当前菜单有同一层级class，则说明同级，隐藏之下的所有菜单
                leaveMenuItem($root, activeMenuItems[i], opt);
                break;
              }
            }
            enterMenuItem($root, $(item), opt, level);
          }
        }
      } else {
        // 如果最后一个状态是移出菜单，则隐藏一级菜单外的其他菜单
        // var $itemFirstLevel = $(item).parents('.stretchmenu-item__firstlevel');
        // var itemIndex = $itemFirstLevel.index();
        // var $menuItemShow = $itemFirstLevel.size() ? $itemFirstLevel.parent().next().children().children().eq(itemIndex) : $(item);
        // console.log($menuItemShow)
        // leaveMenuItem($root, $menuItemShow, opt);
        var menuClassFirstLevel = 'stretchmenu-item__firstlevel';
        // 清空选中样式
        var activeMenuItems = menuTimeoutObj.activeMenuItems;
        for (var i = 0; i < activeMenuItems.length; i++) {
          if (activeMenuItems[i].hasClass(menuClassFirstLevel)) {
            // 如果选中菜单的class与一级菜单有同一层级class，则说明已经是一级菜单了，隐藏之下的所有菜单
            leaveMenuItem($root, activeMenuItems[i], opt);
          }
          removeMenuActiveStyle(activeMenuItems[i]);
        }
        activeMenuItems.length = 0;
      }
      menuTimeoutObj.lastMenu = item;
      menuTimeoutObj.lastMenuState = isEnter;
      menuTimeoutObj.lastMenuLevel = level;
    }

    menuTimeoutObj.menuHover = setTimeout(menuTimeoutObj.menuHoverFunc, 500);
  }

  /**
   * 判断上一个菜单是否是当前菜单的上层级的菜单
   * @param  {[type]}  currentLevel [description]
   * @param  {[type]}  prevLevel    [description]
   * @param  {[type]}  opt          [description]
   * @return {Boolean}              [description]
   */
  function isParentsMenuPrev(prevLevel, currentLevel, opt) {
    var levels = opt.levels;
    for (var i = 0; i < levels.length; i++) {
      if (levels[i] == prevLevel) {
        return true;
      } else if (levels[i] == currentLevel) {
        return false;
      }
    }
    return false;
  }

  function setMenuActive($root, $menuItemShow, opt) {
    var menuTimeoutObj = $root.data('menuTimeoutObj');
    var activeMenuItems = menuTimeoutObj.activeMenuItems;
    var activeMenuItemsPrev = [];
    // 保存选中的按钮状态
    for (var i = 0; i < activeMenuItems.length; i++) {
      activeMenuItemsPrev.push(activeMenuItems[i]);
    }
    activeMenuItems.length = 0;
    // 当前按钮选中
    // addMenuActiveStyle($menuItemShow);
    activeMenuItems.push($menuItemShow);
    $menuItemShow.parents('.stretchmenu-item').each(function (index, element) {
      var itemIndex = $(this).index();
      var $itemShow = $(this).parent().next().children('.stretchmenu-list').children().eq(itemIndex);
      // addMenuActiveStyle($itemShow);
      activeMenuItems.push($itemShow);
    });
    var changeLength = activeMenuItemsPrev.length - activeMenuItems.length;
    if (changeLength > 0) {
      // console.log('be less')
      // 如果之前选中的状态比现在的状态多，即之前打开的菜单多
      for (var i = 0; i < activeMenuItemsPrev.length; i++) {
        if (i - changeLength >= 0) {
          // 当前存在同级菜单
          if (activeMenuItemsPrev[i].get(0) == activeMenuItems[i - changeLength].get(0)) {
            // 同级菜单相同，则不处理
          } else {
            // 同级菜单不相同，则去掉之前的状态，加上现在的状态
            removeMenuActiveStyle(activeMenuItemsPrev[i]);
            addMenuActiveStyle(activeMenuItems[i - changeLength]);
          }
        } else {
          // 之前多打开的菜单，清除状态
          removeMenuActiveStyle(activeMenuItemsPrev[i]);
        }
      }
    } else {
      // console.log('be more')
      // 如果之前选中的状态比现在的状态少，即之前打开的菜单少
      // debugger
      for (var i = activeMenuItems.length - 1; i >= 0; i--) {
        if (i + changeLength >= 0) {
          // 当前存在同级菜单
          if (activeMenuItemsPrev[i + changeLength].get(0) == activeMenuItems[i].get(0)) {
            // 同级菜单相同，则不处理
          } else {
            // 同级菜单不相同，则去掉之前的状态，加上现在的状态
            removeMenuActiveStyle(activeMenuItemsPrev[i + changeLength]);
            addMenuActiveStyle(activeMenuItems[i]);
          }
        } else {
          // 当前多打开的菜单，加上状态
          addMenuActiveStyle(activeMenuItems[i]);
        }
      }
    }
  }

  function addMenuActiveStyle($menuItemShow) {
    $menuItemShow.addClass('stretchmenu-item__active');
    activeMoreMenuItem($menuItemShow);
  }

  function removeMenuActiveStyle($menuItemShow) {
    $menuItemShow.removeClass('stretchmenu-item__active');
    recoverMoreMenuItem($menuItemShow);
  }

  function addMenuHoverStyle($menuItemShow) {
    $menuItemShow.addClass('stretchmenu-item__hover');
  }

  function removeMenuHoverStyle($menuItemShow) {
    $menuItemShow.removeClass('stretchmenu-item__hover');
  }

  /**
   * 是否有滚动条
   * @param  {[type]}  $list [description]
   * @return {Boolean}       [description]
   */
  function hasScroll($list) {
    var listWidth = $list.width();
    var itemWidth = $list.children().width();
    console.log(listWidth + '--' + itemWidth)
    return listWidth != itemWidth;
  }

  function getMenuItemVisibleIndex($menuList, menuItemIndex) {
    var menuIndex = 0;
    $menuList.children().each(function (index, element) {
      if ($(this).is(':visible')) {
        if (index < menuItemIndex) {
          menuIndex++;
        } else {
          return false;
        }
      }
    });
    return menuIndex;
  }

  /** 计算子菜单的宽度与高度 **/
  function calcMenuWidthAndHeight($items, subMenuFontSize, subMenuItemHeight, subMenuMaxHeight, opt) {
    // 最大文字长度
    var maxTextLength = 0;
    var subMenuHeight = 0;
    $items.each(function (index, element) {
      var textLength = covertToZhTextLength($(this).text());
      // 如果有更多图标，则固定添加一个字长度
      if ($(this).find('.stretchmenu-more').size()) {
        textLength++;
      }
      if (textLength > maxTextLength) {
        maxTextLength = textLength;
      }
      // 高度累加
      subMenuHeight += subMenuItemHeight;
    });
    // 计算子菜单的宽度，左右两边各一个字的宽度，再预留一个更多按钮的宽度，所以最后加三
    var subMenuWidth = subMenuFontSize * (maxTextLength + 3);
    // 判断是否会出现滚动条，如果出现，则加上滚动条的宽度
    if (subMenuHeight > subMenuMaxHeight) {
      subMenuWidth += opt.scrollWidth;
    }
    return {
      'width': subMenuWidth,
      'height': subMenuHeight
    }
  }

  /** 转化为中文后的字体长度 **/
  function covertToZhTextLength(text) {
    var wholeText = text.replace(/^\s*/g, '').replace(/\s*$/g, '');
    // 去掉中文、全角后的字符串
    var noChineseText = wholeText.replace(/[^\x00-\xff]/g, '');
    // 中文字符串的长度
    var chineseTextLength = wholeText.length - noChineseText.length;
    // 换算成中文后的字符串总长度，比例为目测得出，ie8下可能会有少许出入
    var textLength = chineseTextLength + noChineseText.length / 20 * 11;
    return textLength;
  }

  /**
   * 滚动条停止滚动事件
   * @param  {[type]}   $dom     [description]
   * @param  {Function} callback [description]
   * @param  {[type]}   timeout  [description]
   * @return {[type]}            [description]
   */
  function scrollEnd($dom, callback, timeout) {
    $dom.scroll(function (e) {
      var $this = $(this);
      var scrollTimeout = $this.data('scrollTimeout');
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      $this.data('scrollTimeout', setTimeout(function () {
        callback($this, e);
      }, timeout));
    });
  }

  /**
   * 滚动菜单
   * @param  {[type]} dom       [description]
   * @param  {[type]} direction [description]
   * @param  {[type]} opt       [description]
   * @return {[type]}           [description]
   */
  function scrollMenu(dom, direction, opt) {
    var $list = $(dom).parent().prev();
    var scrollTop = $list.scrollTop();
    // 默认滚动三个默认菜单项高度
    var distance = opt.menuItemHeight * 3;
    if (direction == 'up') {
      distance = -distance;
    }
    $list.stop().animate({
      'scrollTop': scrollTop + distance + 'px'
    });
  }

}));