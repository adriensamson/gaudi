/*global angular,$*/

var gaudiConfigBuilder = angular.module('gaudiConfigBuilder', []);

/*
gaudiConfigBuilder.factory('Components', function(){
    return [
        {name: 'Apache', type: 'apache'}
    ]
});
*/

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

gaudiConfigBuilder.controller('componentsController', function ($scope, $http) {
    $http.get('data/components.json').success(function (data) {
        $scope.components = data;
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
    $("#board").droppable({
        accept: '.list-group-item',
        drop: function (event, ui) {
            $(this).append($(ui.draggable).clone());
        }
    });
});
