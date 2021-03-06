/**
 * 左侧伸展导航菜单
 * @auto jzw
 * @version 1.0.4
 * @history
 *   1.0.0 2018-02-02 完成导航菜单基本功能
 *   1.0.1 2018-02-02 修改了js中部分变量无值可能会报错的问题
 *   1.0.2 2018-02-05 修改移入效果线被遮挡的问题，修改了更多图标会闪动的问题，修改google浏览器下滚动条宽度计算不正常的问题，
 *         修改了google浏览器下子菜单无滚动条时移入出现的滚动条闪烁问题
 *   1.0.3 2018-02-06 修改滚动到底部上方菜单项未对齐时突出显示菜单的问题
 *   1.0.4 2018-02-06 窗口大小改变后菜单改为进行重置，底部菜单项未显示完全时移入显示完全
 *   1.1.0 2018-02-07 加上是否有图标配置，并且如果有图标，则可以缩小放大
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
      menuShrinkWidth: 50, // 菜单收缩后的宽度
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
      menuItemHasIcon: false, // 菜单项是否有图标
      menuItemIconWidth: 20, // 菜单项图标宽度
      menuItemIconHeight: 20, // 菜单项图标高度
      menuScrollPannel: 30, // 滚动按钮栏的高度
      moreIconWidth: 10, // 更多图标的大小
      ellipticalChars: '...', // 超出字数时显示的省略标志
      isMenuStretched: true,
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

    var $root = $(this);
    // 初始化
    init($root, opt);
    // 重置菜单
    resizeEnd($root, function () {
      init($root, opt);
    }, 500);

    return {
      toggleMenu: function () {
        if (opt.menuItemHasIcon) {
          toggleMenu($root, opt);
        }
      }
    }
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
    if (!scrollWidth || scrollWidth < 17) {
      scrollWidth = 27;
      console.log('滚动条默认27px');
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
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '" title="' + element.title + '" storetitle="' + shortTitle + '">' + shortTitle + '</a>';
      } else {
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '" storetitle="' + element.title + '">' + element.title + '</a>';
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
      var extraClass = element.extraClass || '';
      sb += '<dd class="stretchmenu-item stretchmenu-item__' + level + ' stretchmenu-item__visible">';

      var shortTitle = getShortTitle(element.title, levelCamel, opt);
      if (shortTitle) {
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '" title="' + element.title + '" storetitle="' + shortTitle + '"><i class="stretchmenu-itemi ' + extraClass + '"></i><span>' + shortTitle + '</span></a>';
      } else {
        sb += '<a class="stretchmenu-a stretchmenu-a__' + level + '" title="' + element.title + '" storetitle="' + element.title + '"><i class="stretchmenu-itemi ' + extraClass + '"></i><span>' + element.title + '</span></a>';
      }

      // 移入效果线
      sb += '<div class="stretchmenu-line stretchmenu-line__a"></div><div class="stretchmenu-line stretchmenu-line__b"></div>';
      if (element.children && element.children.length) {
        // 更多图标
        sb += '<div class="stretchmenu-more">';
        sb += '<div class="stretchmenu-more__top"></div><div class="stretchmenu-more__bottom"></div>';
        sb += '</div>';
      }
      // 菜单项分割线
      sb += '<div class="stretchmenu-separator"></div>';
      sb += '</dd>';
    }
    sb += '<dt class="stretchmenu-curtain"></dt>';
    sb += '</dl>';
    // 滚动按钮
    sb += '<div class="stretchmenu-slidebox">'
          // + '<div class="stretchmenu-slideboxline"></div>'
          + '<a class="stretchmenu-scrollbtn stretchmenu-scrollbtn__up stretchmenu-scrollbtn__upoff"></a>'
          + '<a class="stretchmenu-scrollbtn stretchmenu-scrollbtn__down stretchmenu-scrollbtn__downon"></a>'
        + '</div>'
    // 菜单左侧隔离线
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

    // 判断一级菜单是否超过最大高度，即是否会出现滚动条
    var showMenuItemSize = Math.floor($root.height() / opt.menuItemHeightFirstLevel);
    var $menuListShow = $root.find('.stretchmenu-list__firstlevel.stretchmenu-list__visible');
    if (showMenuItemSize < opt.data.length) {
      // 如果显示的一级菜单项数少于总的一级菜单项数
      // 一级菜单列表样式
      // $root.find('.stretchmenu-list__visible').css({
      //   'width': opt.menuWidth + opt.scrollWidth + 'px'
      // }); 
      
      // 列表调整宽度与高度
      $menuListShow.css({
        'width': opt.menuWidth + opt.scrollWidth + 'px',
        'height': $menuListShow.parent().height() - opt.menuScrollPannel + 'px'
      });
      // 调整菜单项宽度
      $menuListShow.children('.stretchmenu-item').css({
        'width': opt.menuWidth + 'px'
      });
      // 显示滚动按钮
      $menuListShow.next().show();

      // 调整更多图标的位置
      $menuListShow.find('.stretchmenu-more').css({
        'top': (opt.menuItemHeightFirstLevel - opt.moreIconWidth) / 2 + 'px'
      });

      $root.children('.stretchmenu-list__firstlevel').attr({
        'overMaxHeight': 'true',
        'showMenuItemSize': showMenuItemSize
      });
    } else {
      // 列表调整宽度
      $menuListShow.css({
        'width': opt.menuWidth + 'px'
      });
      // 调整更多图标的位置
      $menuListShow.find('.stretchmenu-more').css({
        'top': (opt.menuItemHeightFirstLevel - opt.moreIconWidth) / 2 + 'px'
      });
    }

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

    // 菜单图标样式
    if (opt.menuItemHasIcon) {
      $root.find('.stretchmenu-itemi').css({
        'width': opt.menuItemIconWidth + 'px',
        'height': opt.menuItemIconHeight + 'px',
        'marginRight': '15px'
      });
    }

    // 更多图标样式，图标大小10x10
    $root.find('.stretchmenu-item__firstlevel > .stretchmenu-more').css({
      'top': (opt.menuItemHeightFirstLevel - opt.moreIconWidth) / 2 + 'px'
    });
    $root.find('.stretchmenu-item__secondlevel > .stretchmenu-more').css({
      'top': (opt.menuItemHeightSecondLevel - opt.moreIconWidth) / 2 + 'px'
    });
    $root.find('.stretchmenu-item__thirdlevel > .stretchmenu-more').css({
      'top': (opt.menuItemHeightThirdLevel - opt.moreIconWidth) / 2 + 'px'
    });
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
      'height': getMenuItemHeight(opt, level) + 'px',
      'lineHeight': getMenuItemHeight(opt, level) + 'px',
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
      addMenuHoverStyle($item);
      enterMenuAnimation($item, opt);

      judgeMenuHoverState($root, this, opt, 'SecondLevel', true); 
    });
    // 一级菜单移出事件
    $root.off('mouseleave', '.stretchmenu-item__firstlevel.stretchmenu-item__visible')
      .on('mouseleave', '.stretchmenu-item__firstlevel.stretchmenu-item__visible', function (e) {
      // console.log('leave 1');
      var $item = $(this);
      removeMenuHoverStyle($item);
      leaveMenuAnimation($item, opt);

      judgeMenuHoverState($root, this, opt, 'SecondLevel', false);
    });

    // 二级菜单移入事件
    var secondMenuTimeout;
    $root.off('mouseenter', '.stretchmenu-item__secondlevel.stretchmenu-item__visible')
      .on('mouseenter', '.stretchmenu-item__secondlevel.stretchmenu-item__visible', function (e) {
      // console.log('enter 2');
      var $item = $(this);
      addMenuHoverStyle($item);
      enterMenuAnimation($item, opt);

      judgeMenuHoverState($root, this, opt, 'ThirdLevel', true);
    });
    // 二级菜单移出事件
    $root.off('mouseleave', '.stretchmenu-item__secondlevel.stretchmenu-item__visible')
      .on('mouseleave', '.stretchmenu-item__secondlevel.stretchmenu-item__visible', function (e) {
      // console.log('leave 2');
      var $item = $(this);
      removeMenuHoverStyle($item);
      leaveMenuAnimation($(this), opt);

      judgeMenuHoverState($root, this, opt, 'ThirdLevel', false);
    });

    // 三级菜单移入事件
    $root.off('mouseenter', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible')
      .on('mouseenter', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible', function (e) {
      // console.log('enter 3');
      var $item = $(this);
      addMenuHoverStyle($item);
      enterMenuAnimation($(this), opt);
      
      judgeMenuHoverState($root, this, opt, 'ForthLevel', true);
    });
    // 三级菜单移出事件
    $root.off('mouseleave', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible')
      .on('mouseleave', '.stretchmenu-item__thirdlevel.stretchmenu-item__visible', function (e) {
      // console.log('leave 3');
      var $item = $(this);
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
      if (menuTimeoutObj.menuHoverFunc) {
        menuTimeoutObj.menuHover = setTimeout(menuTimeoutObj.menuHoverFunc, 500);
      }
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
      if (menuTimeoutObj.mouseLocation != 'scrollPannel' && menuTimeoutObj.menuHoverFunc) {
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
    var menuItemHeightShow = getMenuItemHeight(opt, getPrevLevel(opt, level));
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
    var menuItemHeight = getMenuItemHeight(opt, level);
    // 记录菜单项的高度
    $menuList.data('menuItemHeight', menuItemHeight);
    // 子菜单的最大高度
    var subMenuMaxHeight = menuItemHeight * opt.subMenuMaxShowSize;
    // 子菜单的实际宽高
    var dimension = calcMenuWidthAndHeight($menuList.children().children('.stretchmenu-a'), 
      opt['menuItemFontSize' + level], menuItemHeight, subMenuMaxHeight, opt);
    // 子菜单显示的高度
    var menuHeight = dimension.height > subMenuMaxHeight ? subMenuMaxHeight : dimension.height;
    // 子菜单的宽度
    var menuListWidth;
    // 如果子菜单的实际高度大于最大高度，则加上移出标志，用于控制显示隐藏多余项滚动条等
    if (dimension.height > subMenuMaxHeight) {
      $menuList.attr({
        'overMaxHeight': 'true'
      });
      menuListWidth = dimension.width + opt.scrollWidth;
      // 调整显示列表高度
      $menuListShow.css({
        'height': menuHeight - opt.menuScrollPannel + 'px'
      });
      // 显示滚动按钮
      $menuListShow.next().show();

      // 有滚动条时的更多按钮的位置，略微向右调整
      // $menuListShow.find('.stretchmenu-more').css({
      //   'top': (opt['menuItemHeight' + level] - opt.moreIconWidth) / 2 + 'px'
      // });
    } else {
      menuListWidth = dimension.width;
      // 没有滚动条时的更多按钮的位置
      // $menuListShow.find('.stretchmenu-more').css({
      //   'top': (opt['menuItemHeight' + level] - opt.moreIconWidth) / 2 + 'px'
      // });
    }
    // 调整菜单项宽度
    $menuListShow.children('.stretchmenu-item').css({
      'width': dimension.width + 'px'
    });

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
    $menuListShow.css({
      'overflow': 'hidden'
    });
    $menuBox.css({
      'top': '0px',
      'height': '1px',
      'overflow': 'hidden'
    }).animate({
      'width': dimension.width + 'px',
      'right': - dimension.width + 'px'
    }, 'fast', 'swing', function () {
      // 设置列表的宽度
      $menuBox.children('.stretchmenu-list').css({
        'width': menuListWidth + 1 + 'px' // 宽度+1防止刚好时google浏览器下会莫名出现滚动条闪烁
      });
      // 下方列表的宽度
      $menuList.css({
        'width': dimension.width + 'px',
        'right': - dimension.width + 'px'
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
          $menuListShow.css({
            'overflow': ''
          });
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
          $menuListShow.css({
            'overflow': ''
          });
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
        // 如果最后一个状态是移入菜单(上方条件)，
        // 则判断菜单项是否显示完全，即是否滚动条滚动后让菜单只显示了一部分
        var menuItemHeight = getMenuItemHeight(opt, getPrevLevel(opt, level));
        var $item = $(item);
        var $menuList = $item.parent();
        var scrollTop = $menuList.scrollTop();
        if (scrollTop % menuItemHeight != 0 && Math.floor(scrollTop / menuItemHeight) == $item.index()) {
          // 如果没有对齐并且是第一个显示的菜单项，即该菜单项没有显示完全(上方条件)
          // 则向下滚动完全
          $menuList.stop().animate({
            'scrollTop': $item.index() * menuItemHeight + 'px'
          });
          return;
        }
        // 判断菜单项是否是显示的最下方的菜单，并且是否显示完全
        if ($menuList.next().is(':visible')) {
          // 滚动按钮是否显示，即是否可以滚动(上方条件)
          if ($menuList.height() + scrollTop - menuItemHeight * $item.index() < menuItemHeight) {
            // 如果菜单的高度 + 滚动高度 - 菜单项头部的位置 < 一个菜单项的高度，即未显示完全(上方条件)
            // 则向上方滚动一个菜单项高度
            $menuList.stop().animate({
              'scrollTop': scrollTop + menuItemHeight + 'px'
            });
            return;
          }
        }
        
        if (!menuTimeoutObj.lastMenuState) {
          // 上一个状态是移出(上方条件)
          enterMenuItem($root, $(item), opt, level);
        } else if (item !== menuTimeoutObj.lastMenu) {
          // 如果上一个状态是移入状态且当前菜单项与上一个菜单项不同时(上方条件)
          if (level === menuTimeoutObj.lastMenuLevel) {
            // console.log('上一个菜单项与当前菜单项同级')
            // 如果上一个菜单项与当前菜单项同级(上方条件)
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

  function toggleMenu($root, opt) {
    var $visibleBox = $root.children('.stretchmenu-list__visiblebox');
    var $menuListShow = $visibleBox.children('.stretchmenu-list__firstlevel');
    var $menuItemsShow = $menuListShow.children('.stretchmenu-item__firstlevel');
    var $menuItemAsShow = $menuItemsShow.children('.stretchmenu-a__firstlevel');
    var $menuItemIconsShow = $menuItemAsShow.children('.stretchmenu-itemi');
    var $moreIcons = $menuItemsShow.children('.stretchmenu-more');
    var $menuList = $root.children('.stretchmenu-list__firstlevel');
    var $menuItems = $menuList.children('.stretchmenu-item__firstlevel');
    var $menuItemAs = $menuItems.children('.stretchmenu-a__firstlevel');
    var $scrollBtn = $visibleBox.find('.stretchmenu-scrollbtn');
    var menuWidth;
    var menuListWidth;
    var menuItemMargin;
    var scrollBtnMargin;
    if (opt.isMenuStretched) {
      // 当前菜单是展开状态(上方条件)
      menuWidth = opt.menuShrinkWidth;
      menuListWidth = opt.menuShrinkWidth + opt.scrollWidth;
      scrollBtnMargin = '4px 2px 0';
      // 隐藏更多图标
      $moreIcons.hide();
      // 文字隐藏
      $menuItemAsShow.find('span').text('');
      // 文字隐藏
      $menuItemAs.text('');
      menuItemMarginRight = '0px';
    } else {
      // 当前菜单是收缩状态(上方条件)
      menuWidth = opt.menuWidth;
      menuListWidth = opt.menuWidth + opt.scrollWidth;
      scrollBtnMargin = '';
      // 文字显示
      $menuItemAsShow.each(function (index, element) {
        $(this).find('span').text($(this).attr('storetitle'));
      });
      // 文字显示
      $menuItemAs.each(function (index, element) {
        $(this).text($(this).attr('storetitle'));
      });
      menuItemMarginRight = '15px';
    }
    opt.isMenuStretched = !opt.isMenuStretched;
    $root.animate({
      'width': menuWidth + 'px'
    });
    $visibleBox.animate({
      'width': menuWidth + 'px'
    });
    $menuListShow.animate({
      'width': menuListWidth + 'px'
    });
    $menuItemsShow.animate({
      'width': menuWidth + 'px'
    }, function () {
      if (opt.isMenuStretched) {
        // 显示更多图标
        $moreIcons.show();
      }
    });
    $menuList.animate({
      'width': menuWidth + 'px'
    });
    $scrollBtn.css({
      'margin': scrollBtnMargin
    })
    $menuItemIconsShow.css({
      'marginRight': menuItemMarginRight
    });
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

  /**
   * [getMenuItemHeight 查询菜单项高度]
   * @param  {[type]} opt   [description]
   * @param  {[type]} level [description]
   * @return {[type]}       [description]
   */
  function getMenuItemHeight(opt, level) {
    return opt['menuItemHeight' + level];
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
      // 如果菜单项有图标，则再加两个字宽度
      if (opt.menuItemHasIcon) {
        textLength += 2;
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
   * [resizeEnd 窗口大小改变停止]
   * @param  {[type]}   $dom     [description]
   * @param  {Function} callback [description]
   * @param  {[type]}   timeout  [description]
   * @return {[type]}            [description]
   */
  function resizeEnd($dom, callback, timeout) {
    $(window).resize(function (e) {
      var resizeTimeout = $dom.data('resizeTimeout');
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      $dom.data('resizeTimeout', setTimeout(function () {
        callback($dom, e);
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