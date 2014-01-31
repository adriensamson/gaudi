/*global angular,$,joint,YamlDumper*/

var gaudiConfigBuilder = angular.module('gaudiConfigBuilder', []);

var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#graphContainer'),
    width: '100%',
    height: 500,
    gridSize: 1,
    model: graph
});

gaudiConfigBuilder.directive("onFinishRender", function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last) {
                $timeout(function () {
                    scope.$emit(attr.onFinishRender);
                });
            }
        }
    };
});

gaudiConfigBuilder.directive("edit", function ($scope) {
    return {
        restrict: 'E',
        transclude: true,
        template: 'hohoho'
    }
});

gaudiConfigBuilder.controller('componentsController', function ($scope, $http) {
    $http.get('data/components.json').success(function (data) {
        $scope.availableComponents = data;
    });

    function initDraggable() {
        $(".components li").draggable({
            revert: "invalid",
            helper: "clone"
        });
    }

    $scope.$on('onDisplayComponents', initDraggable);
});


gaudiConfigBuilder.controller('boardController', function ($scope) {
    $scope.components = {};

    function onCreateLink(target) {
        var currentType = this.get('componentType');
        var currentComponent = $scope.components[currentType];
        var linkedType = graph.getCell(target).get('componentType');

        if ($.inArray(linkedType, currentComponent.links) < 0) {
            currentComponent.links.push(linkedType);
        }
    }

    function onOpenDetail() {
        var currentType = this.get('componentType');
        $('.component[data-type="' + currentType + '"] .edit')
            .popover({
                html: true,
                content: "<edit type='" + currentType + "'></edit>"
            })
            .popover('show');
    }

    $("#graphContainer").droppable({
        accept: '.list-group-item',
        drop: function (event, ui) {
            var
                element = ui.draggable[0],
                draggableDocumentOffset = ui.helper.offset(),
                droppableDocumentOffset = $(this).offset(),
                left = draggableDocumentOffset.left - droppableDocumentOffset.left,
                top = draggableDocumentOffset.top - droppableDocumentOffset.top,
                componentType = element.attributes['data-type'].value;

            var rect = new joint.shapes.html.GaudiGraphComponent({
                position: { x: left, y: top },
                size: { width: 150, height: 60 },
                label: element.innerHTML.trim(),
                componentType: componentType
            });

            graph.addCell(rect);
            rect.on('createLink', onCreateLink);
            rect.on('onOpenDetail', onOpenDetail);

            $scope.components[componentType] = {
                type: componentType,
                name: componentType,
                links: []
            };
        }
    });

    $scope.generateFile = function () {
        var results = {applications: $scope.components};
        var yaml = new YamlDumper();
        var fakeLink = document.createElement('a');

        fileContent = yaml.dump(results, 5);

        fakeLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
        fakeLink.setAttribute('download', '.gaudi.yml');
        fakeLink.click();
    };
});
