YUI.add('carousel', function(Y) {

    var Lang = Y.Lang,
        Node = Y.Node;

    function Carousel(config) {
        Carousel.superclass.constructor.apply(this, arguments);
    }

    Carousel.NAME = 'carousel';

    Carousel.ATTRS = {
        srcNode : {
            value : null,
            writeOnce : true
        },

        /*
         * arrows, dots, numbers
        */
        navigationType : {
            value : [],
            setter : function(v, n) {
                if (!Lang.isArray(v)) {
                    return [v];
                }
                return v;
            }
        },


        navigationTriggerEvent : {
            value : 'mouseover'
        },

        delay : {
            value : 5
        },

        scrollSpeed : {
            value : 0.3
        },

        scrollEasing : {
            value : 'easeIn'
        },

        intervalDuration : {
            value : 4000
        },

        circular : {
            value : false
        },

        images : {
            value : []
        }
    };

    Carousel.TYPE_NUMBERS = 'numbers';
    Carousel.TYPE_DOTS    = 'dots';
    Carousel.TYPE_ARROWS  = 'arrows';

    Carousel.CLASS_PREFIX = Y.ClassNameManager.getClassName(Carousel.NAME) + '-';
    Carousel.UL_CLASS     = Carousel.CLASS_PREFIX + 'stack';
    Carousel.ACTIVE_CLASS = Carousel.CLASS_PREFIX + 'nav-active';


    Carousel.NUMBERS_CONTAINER_CLASS    = Carousel.CLASS_PREFIX + 'numbers-container';
    Carousel.NUMBERS_CONTAINER_TEMPLATE = '<ul class="' + Carousel.NUMBERS_CONTAINER_CLASS  + '"></ul>';
    Carousel.NUMBERS_TEMPLATE           = '<li data-index={nodeindex}></li>';

    Carousel.DOTS_CONTAINER_CLASS    = Carousel.CLASS_PREFIX + 'dots-container';
    Carousel.DOTS_CONTAINER_TEMPLATE = '<ul class="' + Carousel.DOTS_CONTAINER_CLASS  + '"></ul>';
    Carousel.DOTS_TEMPLATE           = '<li data-index={nodeindex}></li>';

    Carousel.ARROW_LEFT_CLASS     = Carousel.CLASS_PREFIX + 'arrow-left';
    Carousel.ARROW_RIGHT_CLASS    = Carousel.CLASS_PREFIX + 'arrow-right';
    Carousel.ARROW_DISABLED_CLASS = Carousel.CLASS_PREFIX + 'arrow-disabled';
    Carousel.ARROW_TEMPLATE       = '<div class="{classname}"><span></span></div>';

    /* Carousel extends the base Widget class */
    Y.extend(Carousel, Y.Widget, {

        initializer: function(config) {
            this.currentIndex = 1;
            this.typesContainer = {};
            this.arrows = {};
            this.intervalTimer = null;
            this.images = {};

            this.publish('carousel:move', { defaultFn: this._onCarouselMove, preventable: false, broadcast: 1 });
        },

        destructor : function() {
            this._clearInterval();
            Y.detach('carousel|*');
        },

        renderUI : function() {
            this._renderImages();

            var navigationType = this.get('navigationType');
            for (var i = 0, type; type = navigationType[i++];) {
                this._renderNavigation(type);
            }
        },

        bindUI : function() {
            var navigationType = this.get('navigationType');
            for (var i = 0, type; type = navigationType[i++];) {
                this._bindNavigation(type);
            }
        },

        syncUI : function() {
            var navigationType = this.get('navigationType');
            for (var i = 0, type; type = navigationType[i++];) {
                this._syncNavigation(type);
            }
            this._setInterval();
        },

        _onCarouselMove : function() {
            var navigationType = this.get('navigationType'), container, node;
            for (var i = 0, type; type = navigationType[i++];) {
                switch (type) {
                    case Carousel.TYPE_NUMBERS:
                    case Carousel.TYPE_DOTS:
                        container = this.typesContainer[type];
                        node      = container.one('li[data-index=' + this.currentIndex + ']');
                        container.get('children').removeClass(Carousel.ACTIVE_CLASS);
                        node.addClass(Carousel.ACTIVE_CLASS);
                        break;
                    case Carousel.TYPE_ARROWS:
                        this.arrows.removeClass(Carousel.ARROW_DISABLED_CLASS);
                        if (this.currentIndex === 1) {
                            this.arrows.item(0).addClass(Carousel.ARROW_DISABLED_CLASS);
                        } else if (this.currentIndex === this.images.count) {
                            this.arrows.item(1).addClass(Carousel.ARROW_DISABLED_CLASS);
                        }
                        break;
                }
            }
        },

        _clearInterval : function() {
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        },

        _setInterval : function() {
            var intervalDuration = this.get('intervalDuration');
            if (intervalDuration > 0 && this.intervalTimer === null) {
                this.intervalTimer = window.setInterval(Y.bind(this._handleIntervalFlow, this), intervalDuration);
            }
        },

        _handleIntervalFlow : function() {
            var reset = this.images.count === this.currentIndex;
            this.currentIndex++;
            this._handleMovement(reset);
        },

        _renderImages : function() {
            this.images.container = this.get('srcNode').one('ul.' + Carousel.UL_CLASS);
            if (this.get('images').length) {
            } else {
                this.images.items = this.images.container.get('children');
                this.images.container.append(this.images.items.item(0).cloneNode(true));
            }

            // images average width
            this.images.width = parseInt(this.images.items.item(0).getElementsByTagName('IMG').getStyle('width'));
            this.images.count = this.images.items.size();
        },

        _renderNavigation : function(type) {
            var navFadeIn = function(node) {
                new Y.Anim({
                    node: node,
                    duration: 0.2,
                    to: {
                        'opacity' : 1
                    }
                }).run();
            };

            switch (type) {
                case Carousel.TYPE_NUMBERS:
                    var container = Y.Node.create(Carousel.NUMBERS_CONTAINER_TEMPLATE);
                    for (var i = 0, len = this.images.count, node, index; i < len; i++) {
                        index = i + 1;
                        node = Y.Node.create(Y.substitute(Carousel.NUMBERS_TEMPLATE, {nodeindex: index}));
                        node.set('text', index);
                        container.append(node);
                    }
                    container.setStyle('opacity', 0);
                    this.get('srcNode').append(container);
                    navFadeIn(container);
                    this.typesContainer[Carousel.TYPE_NUMBERS] = container;
                    break;
                case Carousel.TYPE_DOTS:
                    var container = Y.Node.create(Carousel.DOTS_CONTAINER_TEMPLATE);
                    for (var i = 0, len = this.images.count, node, index; i < len; i++) {
                        index = i + 1;
                        node = Y.Node.create(Y.substitute(Carousel.DOTS_TEMPLATE, {nodeindex: index}));
                        container.append(node);
                    }
                    container.setStyle('opacity', 0);
                    this.get('srcNode').append(container);
                    navFadeIn(container);
                    this.typesContainer[Carousel.TYPE_DOTS] = container;
                    break;
                case Carousel.TYPE_ARROWS:
                    var arrowLeft  = Y.Node.create(Y.substitute(Carousel.ARROW_TEMPLATE, {classname: Carousel.ARROW_LEFT_CLASS})),
                        arrowRight = Y.Node.create(Y.substitute(Carousel.ARROW_TEMPLATE, {classname: Carousel.ARROW_RIGHT_CLASS}));
                    this.arrows = Y.all([arrowLeft, arrowRight]);
                    this.arrows.setStyle('opacity', 0);
                    this.get('srcNode').append(this.arrows.item(0)).append(this.arrows.item(1));
                    navFadeIn(this.arrows.item(0));
                    navFadeIn(this.arrows.item(1));
                    break;
            }
        },

        _bindNavigation : function(type) {
            var container = this.typesContainer[type];
            switch (type) {
                case Carousel.TYPE_NUMBERS:
                case Carousel.TYPE_DOTS:
                    Y.delegate(this.get('navigationTriggerEvent'), Y.bind(this._onNavigationMenu, this), container, 'li');
                    container.on('mouseout', Y.bind(this._setInterval, this));
                    break;
                case Carousel.TYPE_ARROWS:
                    this.arrows.on('mouseenter', Y.bind(this._clearInterval, this));
                    this.arrows.on('mouseleave', Y.bind(this._setInterval, this));
                    this.arrows.on('click', Y.bind(function(e) {
                        var target = e.currentTarget, circular = this.get('circular');
                        if (target.hasClass(Carousel.ARROW_LEFT_CLASS)) {
                            if (this.currentIndex === 1) return;
                            this.currentIndex--;
                            this._handleMovement();
                        } else if (target.hasClass(Carousel.ARROW_RIGHT_CLASS)) {
                            if (this.currentIndex === this.images.count && !circular) return;
                            this.currentIndex++;
                            this._handleMovement();
                        }
                    }, this));
                    break;
            }
        },

        _syncNavigation : function(type) {
            var container = this.typesContainer[type];
            switch (type) {
                case Carousel.TYPE_NUMBERS:
                    container.get('children').item(0).addClass(Carousel.ACTIVE_CLASS);
                    break;
                case Carousel.TYPE_DOTS:
                    container.get('children').item(0).addClass(Carousel.ACTIVE_CLASS);
                    break;
                case Carousel.TYPE_ARROWS:
                    this.arrows.item(0).addClass(Carousel.ARROW_DISABLED_CLASS);
                    break;
            }
        },

        _onNavigationMenu : function(e) {
            var container = e.container,
                node = e.currentTarget,
                index = parseInt(node.getAttribute('data-index'));

            this._clearInterval();
            if (this.currentIndex === index) {
                return;
            }

            this.currentIndex = index;
            this._handleMovement();
        },

        _handleMovement : function(reset) {
            var currentLeft = this.images.container.getStyle('left'), left = 0, idx = this.currentIndex;
            currentLeft = isNaN(parseInt(currentLeft)) ? 0 : currentLeft;
            reset = reset || false;
            if (idx > 1) {
                left = '-' + (this.images.width * (idx - 1)) + 'px';
            }
            var mv = new Y.Anim({
                node: this.images.container,
                duration: this.get('scrollSpeed'),
                from: {
                    'left' : currentLeft
                },
                to: {
                    'left' : left
                }
            });
            mv.set('easing', Y.Easing[this.get('scrollEasing')]);
            if (reset) {
                mv.on('end', function() {
                    this.get('node').setStyle('left', 0);
                });
                this.currentIndex = 1;
            }
            mv.run();
            this.fire('carousel:move');
        }

    });

    Y.Carousel = Carousel;

}, '3.1.0', {requires:['widget', 'anim', 'node', 'substitute', 'event-mouseenter']});
