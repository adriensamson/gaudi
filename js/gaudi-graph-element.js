/* global: $,joint,_*/
joint.shapes.html = {};

joint.shapes.html.GaudiGraphComponent = joint.shapes.basic.Rect.extend({
    defaults: joint.util.deepSupplement({
        type: 'html.Element',
        attrs: {
            rect: { stroke: 'none', 'fill-opacity': 0 }
        }
    }, joint.shapes.basic.Rect.prototype.defaults)
});

joint.shapes.html.ElementView = joint.dia.ElementView.extend({

    link: null,
    canUpdateLink: false,

    template: [
        '<div class="component">',
        '<button class="close">&times;</button>',
        '<div class="content"></div>',
        '<div class="create-link glyphicon glyphicon-record"></div>',
        '<button class="edit glyphicon glyphicon-wrench" data-toggle="popover" data-container="body" ></button>',
        '</div>'
    ].join(''),

    initialize: function() {
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.$box = $(_.template(this.template)());

        this.model.on('change', this.updateBox, this);
        this.model.on('remove', this.removeBox, this);

        this.updateBox();
    },
    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.prepend(this.$box);
        this.updateBox();

        this.$box.find('.create-link').on('mousedown', this.createLink.bind(this));
        this.$box.find('.edit').on('click', this.triggerOpenDetail.bind(this));
        this.$box.find('.close').on('click', _.bind(this.model.remove, this.model));
        this.$box.attr('data-type', this.model.get('componentType'));
        this.$box.find('.content').text(this.model.get('label'));

        this.paper.$el.mousemove(this.onMouseMove.bind(this));
        this.paper.$el.mouseup(this.onMouseUp.bind(this));

        return this;
    },

    updateBox: function() {
        var bbox = this.model.getBBox();

        this.$box.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },

    removeBox: function (evt) {
        this.$box.remove();
    },

    triggerOpenDetail: function (e) {
        e.preventDefault();

        this.model.trigger('onOpenDetail');
    },

    createLink: function (evt) {
        var self = this;
        var papperOffset = this.paper.$el.offset();
        var targetOffset = $(evt.target).offset();

        var x = targetOffset.left - papperOffset.left;
        var y = targetOffset.top  - papperOffset.top;

        this.link = new joint.dia.Link({
            source: {id: this.model.get('id')},
            target: g.point(x, y),
            z: -1,
            attrs: {
                '.connection': { stroke: 'black', 'stroke-width': 6, opacity: .1 },
                '.marker-target': { stroke: 'black', 'stroke-width': 2, d: 'M 20 0 L 0 10 L 20 20 z' },
                '.marker-vertices': {display: 'none'}
            }
        });
        this.paper.model.addCell(this.link);

        // marker arrow color change
        this.link.on('remove', function (lnk) {
            self.model.trigger('onUnLink', lnk.get('target').id);
        });

        this.link.on('change:target', function (lnk) {
            var target = lnk.get('target');
            if (typeof(target.id) === 'undefined') {
                // @TODO : Check if we hit a component
                var el = document.elementFromPoint(target.x, target.y);

                return;
            }

            self.model.trigger('createLink', target.id);
        });

        this.canUpdateLink = true;
    },

    onMouseUp: function () {
        this.canUpdateLink = false;
        this.paper.$el.find('.component').css("z-index", 1);
    },

    onMouseMove: function (evt) {
        if (!this.link || !this.canUpdateLink || evt.offsetX <= 10) {
            return;
        }

        this.link.set('target', g.point(evt.offsetX, evt.offsetY));
    }
});
