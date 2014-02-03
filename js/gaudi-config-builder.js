/*global angular,$,joint,YamlDumper,document*/

var gaudiConfigBuilder = angular.module('gaudiConfigBuilder', ['ui.bootstrap']);

var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: $('#graphContainer'),
    width: '100%',
    height: $('.sidebar').height(),
    gridSize: 1,
    model: graph
});

gaudiConfigBuilder.factory('builder', function () {
    return {
        components: {},
        availableComponents: {}
    };
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

gaudiConfigBuilder.directive("text", function () {

});

gaudiConfigBuilder.controller('componentsController', function ($scope, $http, builder) {
    $scope.availableComponents = {};

    $http.get('data/components.json').success(function (data) {
        $scope.availableComponents = data;
        builder.availableComponents = data;
    });

    function initDraggable() {
        $(".components li").draggable({
            revert: "invalid",
            helper: "clone"
        });
    }

    $scope.$on('onDisplayComponents', initDraggable);
});


gaudiConfigBuilder.controller('boardController', function ($scope, $modal, builder) {
    $scope.components = builder.components;

    function onCreateLink(targetId) {
        var name = this.get('name'),
            currentComponent = $scope.components[name],
            linkedType = graph.getCell(targetId).get('name');

        if ($.inArray(linkedType, currentComponent.links) < 0) {
            currentComponent.links.push(linkedType);
        }

        $scope.$apply();
    }

    function onRemoveLink(sourceId, targetId) {
        var sourceName = graph.getCell(sourceId).get('name'),
            targetName = graph.getCell(targetId).get('name'),
            source = $scope.components[sourceName],
            position;

        if ((position = $.inArray(targetName, source.links)) >= 0) {
            source.links.splice(position, 1);
        }

        $scope.$apply();
    }

    function onRemove() {
        var name = this.get('name'),
            position;

        // Remove element
        delete $scope.components[name];

        // Remove links
        angular.forEach($scope.components, function (componentName, component) {
            if ((position = $.inArray(name, component.links)) >= 0) {
                component.links = component.links.splice(position, 1);
            }
        });

        $scope.$apply();
    }

    function onOpenDetail() {
        var componentName = this.get('name'),
            editModal;

        editModal = $modal.open({
            templateUrl: 'edit-component.html',
            controller: 'editComponentController',
            resolve: {
                values: function () {
                    var values = $scope.components[componentName];
                    values.name = componentName;

                    return values;
                }
            }
        });

        editModal.result.then(function (formData) {
            var otherName,
                otherComponent,
                linkIdx;

            if (formData.name !== componentName) {
                delete $scope.components[componentName];

                // Update links name of other components
                angular.forEach($scope.components, function (otherName, otherComponent) {

                    angular.forEach(otherComponent.links, function (linkIdx, link) {
                        if (otherComponent.links[linkIdx] === componentName) {
                            otherComponent.links[linkIdx] = formData.name;
                        }
                    });
                });

                // Update the name of the graph element
                var rects = graph.getElements(),
                    rectName,
                    rect;

                angular.forEach(rects, function (rectName, rect) {
                    if (rect.get('name') === componentName) {
                        rect.set('name', formData.name);
                    }
                });
            }

            $scope.components[formData.name] = formData.values;
        });
    }

    function getElementName(type) {
        if (typeof $scope.components[type] === 'undefined') {
            return type;
        }

        var infos = type.split('-'),
            nb = typeof (infos[1]) === 'undefined' ? 1 : Number(infos[1]) + 1;

        return getElementName(infos[0] + '-' + nb);
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
                type = element.attributes['data-type'].value,
                name = getElementName(type),
                rect;

            rect = new joint.shapes.html.GaudiGraphComponent({
                position: { x: left, y: top },
                size: { width: 150, height: 90 },
                label: element.innerHTML.trim(),
                name: name
            });

            graph.addCell(rect);
            rect.on('createLink', onCreateLink);
            rect.on('removeLink', onRemoveLink);
            rect.on('onOpenDetail', onOpenDetail);
            rect.on('onRemove', onRemove);

            $scope.components[name] = {
                type: type,
                links: []
            };

            $scope.$apply();
        }
    });
});

gaudiConfigBuilder.controller('resultController', function ($scope, builder) {
    $scope.components = builder.components;

    $scope.getFileResult = function () {
        var results = $scope.components ? {applications: $scope.components} : "";
        var yaml = new YamlDumper();

        return yaml.dump(results, 5);
    };

    $scope.generateFile = function () {
        var fakeLink = document.createElement('a');

        fakeLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.getFileResult()));
        fakeLink.setAttribute('download', '.gaudi.yml');
        fakeLink.click();
    };
});

gaudiConfigBuilder.controller('editComponentController', function ($scope, $modalInstance, $compile, builder, values) {
    // Inject fields types
    $scope.fields = {};
    $scope.fields.custom = builder.availableComponents[values.type].customFields;
    $scope.fields.standard = builder.availableComponents[values.type].fields;

    // Inject fields values
    $scope.componentNames = Object.keys(builder.components);
    $scope.values = values;
    $scope.values.custom = $scope.values.custom || {};
    $scope.values.standard = $scope.values.standard || {};

    $scope.ok = function () {
        var name = $scope.values.name;
        delete $scope.values.name;

        // Merge standard values with root element
        angular.forEach($scope.values.standard, function (standardValue, standardName) {
            $scope.values[standardName] = standardValue;
        });

        delete $scope.values.standard;

        if (!Object.keys($scope.values.custom).length) {
            delete $scope.values.custom;
        }

        $modalInstance.close({name: name, values: $scope.values});
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});
