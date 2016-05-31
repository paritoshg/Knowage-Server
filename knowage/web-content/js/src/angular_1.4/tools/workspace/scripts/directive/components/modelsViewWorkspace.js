/**
 * Knowage, Open Source Business Intelligence suite
 * Copyright (C) 2016 Engineering Ingegneria Informatica S.p.A.
 * 
 * Knowage is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Knowage is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

angular
	.module('models_view_workspace', [])


	/**
	 * The HTML content of the Recent view (recent documents).
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	.directive('modelsViewWorkspace', function () {		
		 return {			 
		      restrict: 'E',
		      replace: 'true',
		      templateUrl: '/knowage/js/src/angular_1.4/tools/workspace/templates/modelsViewWorkspace.html',
		      controller: modelsController
		  };	  
	});

function modelsController($scope,sbiModule_restServices,sbiModule_translate,$mdDialog,sbiModule_config,$window,$mdSidenav,sbiModule_messaging){
	$scope.businessModelsInitial=[];
	$scope.federationDefinitionsInitial=[];
	
	$scope.selectedModel = undefined;

	$scope.showModelInfo = false;
	$scope.idsOfFederationDefinitionsUsediNFederatedDatasets = [];
	$scope.allFederatedDatasets = [];
	
	$scope.federationsEnabled= function (){
		return datasetProperties.CAN_USE_FEDERATED_DATASET_AS_FINAL_USER === "true";

	}
	
	$scope.getFederatedDatasets = function() {
		sbiModule_restServices.promiseGet("1.0/datasets", "")
		.then(function(response) {
			var allDatasets = response.data.root;
			for (var i = 0; i < allDatasets.length; i++) {
				if(allDatasets[i].hasOwnProperty('federationId')) {
					if($scope.idsOfFederationDefinitionsUsediNFederatedDatasets.indexOf(allDatasets[i].federationId)==-1){
						$scope.idsOfFederationDefinitionsUsediNFederatedDatasets.push(allDatasets[i].federationId);
					}
					$scope.allFederatedDatasets.push(allDatasets[i]);
				}
			}
		},function(response){
			
		});
	}
	
	$scope.getFederatedDatasets();
	
	$scope.loadFederations=function(){
		sbiModule_restServices.promiseGet("federateddataset", "")
		.then(function(response) {
			angular.copy(response.data,$scope.federationDefinitions);
			angular.copy($scope.federationDefinitions,$scope.federationDefinitionsInitial);
			console.info("[LOAD END]: Loading of Federation definitions is finished.");
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.browser.folder.load.error'));
		});
	}
	
	
	
	//TODO move business models to separate controller
    $scope.loadBusinessModels= function(){
    	sbiModule_restServices.promiseGet("2.0/businessmodels", "")
		.then(function(response) {
			angular.copy(response.data,$scope.businessModels);
			angular.copy($scope.businessModels,$scope.businessModelsInitial);
			console.info("[LOAD END]: Loading of Business models is finished.");
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.browser.folder.load.error'));
		});
	}
	
	$scope.showModelDetails = function() {
		return $scope.showModelInfo && $scope.isSelectedModelValid();
	};
	
	
	$scope.isSelectedModelValid = function() {
		return $scope.selectedModel !== undefined;
	};
	
	$scope.setDetailOpenModel = function(isOpen) {
		if (isOpen && !$mdSidenav('rightModel').isLockedOpen() && !$mdSidenav('rightModel').isOpen()) {
			$scope.toggleModelDetail();
		}

		$scope.showModelInfo = isOpen;
	};
	
	$scope.toggleModelDetail = function() {
		$mdSidenav('rightModel').toggle();
	};
	
	$scope.selectModel= function ( model ) { 
		if (model !== undefined) {
			//$scope.lastDatasetSelected = dataset;
		}
		var alreadySelected = (model !== undefined && $scope.selectedModel === model);
		$scope.selectedModel = model;
		if (alreadySelected) {
			$scope.selectedModel=undefined;
			$scope.setDetailOpenModel(!$scope.showModelDetail);
		} else {
			$scope.setDetailOpenModel(model !== undefined);
		}
	};
	
	$scope.showQbeModel=function(model){
		
		if($scope.currentTab=='federations'){
			$scope.showQbeFederation(model);
		}else if($scope.currentTab=='businessModels'){
			$scope.showQbeFromBM(model);
		}
	}
	
	$scope.showQbeFederation= function(federation){
        
		var federationId= federation.federation_id;
		
		var url=datasetParameters.qbeEditFederationServiceUrl
		       +'&FEDERATION_ID='+federationId;
		
		 $window.location.href=url;
		
	}
	
	$scope.editFederation=function(federation){
//		console.log(federation);
		var id = federation.federation_id;
		var label = federation.label;
		//$window.location.href=sbiModule_config.contextName+"/restful-services/publish?PUBLISHER=/WEB-INF/jsp/tools/federateddataset/federatedDatasetBusiness.jsp&id="+id+"&label="+label;

    	 $mdDialog.show({
    		  scope:$scope,
			  preserveScope: true,
		      controller: DialogEditFederationController,
		      templateUrl: sbiModule_config.contextName+'/js/src/angular_1.4/tools/documentbrowser/template/documentDialogIframeTemplate.jsp',  
		      clickOutsideToClose:true,
		      escapeToClose :true,
		      fullscreen: true,
		      locals:{federation:federation }
		    })
		
	}
	
	$scope.deleteFederation=function(federation){
		var usedInDatasets = [];
		var fds = $scope.allFederatedDatasets;
		if ($scope.idsOfFederationDefinitionsUsediNFederatedDatasets.indexOf(federation.federation_id)>-1) {
			for (var i = 0; i < $scope.allFederatedDatasets.length; i++) {
				if($scope.allFederatedDatasets[i].federationId==federation.federation_id){
					usedInDatasets.push($scope.allFederatedDatasets[i].label)
				}
			}
			sbiModule_messaging.showErrorMessage(sbiModule_translate.load("sbi.federationdefinition.models.delete")+"["+usedInDatasets+"]", sbiModule_translate.load("sbi.generic.error"));
		} else {
			var confirm = $mdDialog.confirm()
			.title(sbiModule_translate.load("sbi.federationdefinition.confirm.dialog"))
			.content(sbiModule_translate.load("sbi.federationdefinition.confirm.delete"))
			.ariaLabel('delete Document') 
			.ok(sbiModule_translate.load("sbi.general.yes"))
			.cancel(sbiModule_translate.load("sbi.general.No"));
				$mdDialog.show(confirm).then(function() {
				
				sbiModule_restServices.promiseDelete("2.0/federateddataset",federation.federation_id)
				.then(function(response) {
				
					$scope.loadFederations();
					$scope.selectModel(undefined);
				},function(response) {
					sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.browser.document.delete.error'));
				});
			});
		}
	}
	
	$scope.createFederation=function(){
		
		$mdDialog.show({
			  scope:$scope,
			  preserveScope: true,
		      controller: DialogEditFederationController,
		      templateUrl: sbiModule_config.contextName+'/js/src/angular_1.4/tools/documentbrowser/template/documentDialogIframeTemplate.jsp',  
		      clickOutsideToClose:true,
		      escapeToClose :true,
		      fullscreen: true,
		      locals:{federation:undefined}
		    })
	}
	
	$scope.showQbeFromBM=function(businessModel){
		console.log(businessModel);
		//var actionName= 'QBE_ENGINE_START_ACTION_FROM_BM';
		var modelName= businessModel.name;
		var dataSource=businessModel.dataSourceLabel;
		var url= datasetParameters.qbeFromBMServiceUrl
		        +'&isWorksheetEnabled='+datasetParameters.IS_WORKSHEET_ENABLED
		        +'&MODEL_NAME='+modelName
		        +'&DATA_SOURCE_LABEL='+ dataSource;
		
//		var url= sbiModule_config.engineUrls.worksheetServiceUrl
//		         +'&ACTION_NAME='+actionName
//		         +'&MODEL_NAME='+modelName
//		         +'&isWorksheetEnabled=true'
//		         +'&DATA_SOURCE_LABEL='+ dataSource;
		       
		 $window.location.href=url;
	}
	
	function DialogEditFederationController($scope,$mdDialog,sbiModule_config,federation){
	
		$scope.closeFederationDialog=function(){
			 $mdDialog.cancel();	 
			 $scope.loadFederations();
		}
		
		if(federation!==undefined){
		var id =federation.federation_id;
		var label = federation.label;
		$scope.iframeUrl=sbiModule_config.contextName+"/restful-services/publish?PUBLISHER=/WEB-INF/jsp/tools/federateddataset/federatedDatasetBusiness.jsp&id="+id+"&label="+label;
		}else{
			
		$scope.iframeUrl=sbiModule_config.contextName+"/restful-services/publish?PUBLISHER=/WEB-INF/jsp/tools/federateddataset/federatedDatasetBusiness.jsp";	
		}
		
		}
	
	/**
	 * Set the currently active Models tab. Initially, the 'Business Models' tab is selected (active). 
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.currentModelsTab = "businessModels";
	
	$scope.switchModelsTab = function(modelsTab) {
    	
		$scope.currentModelsTab = modelsTab;
    	
		if($scope.selectedModel !== undefined){
			$scope.selectModel(undefined);
		}
    	
	}
}