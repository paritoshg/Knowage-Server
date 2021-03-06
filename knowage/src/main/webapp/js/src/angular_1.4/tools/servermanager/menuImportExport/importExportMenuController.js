var app = angular.module('importExportMenuModule',
		['ngMaterial', 'sbiModule', 'angular_table',
		 'document_tree', 'componentTreeModule', 'file_upload', 'bread_crumb', 'treeControl']);

app.factory('importExportMenuModule_importConf', function() {
		 var current_data = {};
		 var default_values = {
			fileImport : {},
			associationsFileImport : {},
			associations : 'noAssociations',
			fileAssociation : '',
			associationsFileName:"",
			logFileName:"",
			folderName:"",
			roles : {
				currentRoles : [],
				exportedRoles : [],
				associationsRole : {},
				associatedRoles : []
			},
			resetData: function() {
		    	 current_data = angular.copy( default_values,current_data);
		     }
		 };
		default_values.resetData();
	return current_data;
});

app.config(['$mdThemingProvider', function($mdThemingProvider) {

    $mdThemingProvider.theme('knowage')

$mdThemingProvider.setDefaultTheme('knowage');
}]);
app.controller('importExportMenuController', impExpFuncController);

function impExpFuncController(sbiModule_download,sbiModule_device,$scope,$mdDialog,	$timeout,sbiModule_logger,
		sbiModule_translate,sbiModule_restServices,sbiModule_config,$mdToast,sbiModule_messaging,
		importExportMenuModule_importConf,$filter) {

	$scope.stepItem = [{name:'import'}];
	$scope.selectedStep = 0;
	$scope.stepControl;
	$scope.IEDConf = importExportMenuModule_importConf;
	$scope.download = sbiModule_download;

	$scope.importFile = {};
	sbiModule_translate.addMessageFile('component_impexp_messages');
	$scope.translate = sbiModule_translate;
	$scope.menu=[];
	$scope.currentMenu=[];
	$scope.currentRoles=[];
	$scope.exportedRoles=[];
	$scope.exportedObjects = [];
	$scope.associatedRoles=[];
	$scope.tree=[];
	$scope.treeCopy=[];
	$scope.treeInTheDB=[];
	$scope.fileTree = [];
	$scope.typeSaveMenu="Missing";
	$scope.fileTreeExpandedNodes = [];
	$scope.fileTreeDisabledNodes = [];
	$scope.treeInTheDBExpandedNodes = [];
	$scope.treeInTheDBDisabledNodes = [];
	$scope.fileTreeSelectedNodes = [];
	$scope.treeInTheDBSelectedNodes = [];

	menuToUpdatePlaceholder = 'U';
	menuToInsertPlaceholder = 'I';
	menuNotInvolvedPlaceholder = 'NI';
	
	$scope.selectParents = true;
	$scope.selectChildren = true;

	$scope.upload = function(ev){
		if($scope.importFile.fileName == "" || $scope.importFile.fileName == undefined){
			//$scope.showAction(sbiModule_translate.load("sbi.impexpusers.missinguploadfile"));
			sbiModule_messaging.showInfoMessage(sbiModule_translate.load("sbi.impexpusers.missinguploadfile"),"");
		}else{
			var fd = new FormData();

			fd.append('exportedArchive', $scope.importFile.file);
			sbiModule_restServices.post("1.0/serverManager/importExport/menu", 'import', fd, {transformRequest: angular.identity,headers: {'Content-Type': undefined}})
			.success(function(data, status, headers, config) {
				if (data.hasOwnProperty("ERROR")){
					sbiModule_restServices.errorHandler(data.ERROR,"sbi.generic.toastr.title.error");
				}
				if(data.STATUS=="NON OK"){
					sbiModule_restServices.errorHandler(data.ERROR,"sbi.generic.toastr.title.error");
				}
				else if(data.STATUS=="OK"){
					//check role missing
					//clean the vector
					$scope.menu=[];
					$scope.currentMenu=[];
					$scope.currentRoles=[];
					$scope.exportedRoles=[];
					$scope.tree=[];
					$scope.exportedObjects = [];
					$scope.treeCopy=[];
					$scope.treeInTheDB=[];
					$scope.fileTree = [];
					$scope.fileTreeExpandedNodes = [];
					$scope.fileTreeDisabledNodes = [];
					$scope.treeInTheDBExpandedNodes = [];
					$scope.treeInTheDBDisabledNodes = [];
					//get response
					$scope.currentRoles=data.currentRoles;
					$scope.exportedRoles=data.exportedRoles;
					$scope.IEDConf.roles.currentRoles=data.currentRoles;
					$scope.IEDConf.roles.exportedRoles=data.exportedRoles;
					$scope.IEDConf.roles.associatedRoles=data.associatedRoles;
					$scope.currentObjects = data.currentObjects;
					$scope.exportedObjects = data.exportedObjects;
					$scope.menu = data.menu;
					//if($scope.checkRole() && $scope.checkObjects()){
					if($scope.checkObjects()){
						//if role is not present stop the import.

						// $scope.currentMenu all menu in the target
						$scope.currentMenu = data.currentMenu;

						// $scope.menu all menu in file
						$scope.menuArrayCopy = [];
						angular.copy($scope.menu, $scope.menuArrayCopy);

						$scope.currentMenuCopy = [];
						angular.copy($scope.currentMenu, $scope.currentMenuCopy);

						$scope.fileTreeExpandedNodes = $scope.menu;
						$scope.fileTreeDisabledNodes = $scope.menu;
						$scope.fileTree = $scope.treeify($scope.menu, 'menuId', 'parentId');
						//$scope.parseToTree($scope.menu,$scope.fileTree);
//						$scope.fileTree = $filter('orderBy')($scope.fileTree, 'prog');
						
//						$scope.compareTrees();

						$scope.treeInTheDB=[];
						$scope.treeInTheDBExpandedNodes = $scope.currentMenu;
						$scope.treeInTheDBSelectedNodes = $scope.currentMenu;
						$scope.treeInTheDB = $scope.treeify($scope.currentMenu, 'menuId', 'parentId');
//						$scope.treeInTheDB = $filter('orderBy')($scope.treeInTheDB, 'prog');
						$scope.treeCopy=$scope.treeInTheDB;

					}

					$scope.stepControl.insertBread({name: sbiModule_translate.load('SBISet.impexp.exportedMenu','component_impexp_messages')});

				}

			})
			.error(function(data, status, headers, config) {
				sbiModule_restServices.errorHandler(data.ERROR,"sbi.generic.toastr.title.error");
			});
		}
	};

	$scope.compareTrees = function() {
		returnArray = [];
		tmpArray = [];
		/* DB --> FILE */
		maxProg = -1;
		angular.copy($scope.currentMenuCopy, tmpArray);
		angular.forEach(tmpArray, function (scopeMenu) {
			var index = $scope.indexInList(scopeMenu, $scope.menuArrayCopy);
			var indexReturnArray = $scope.indexInList(scopeMenu, returnArray);
			var menu;
			if(index==-1 && indexReturnArray==-1){
				menu = scopeMenu;
				menu.updated = menuNotInvolvedPlaceholder;
				returnArray.push(menu);
			} else {
				menu = $scope.menuArrayCopy[index];
				menu.updated = menuToUpdatePlaceholder;
				returnArray.push(menu);
			}
			if (maxProg < menu.prog) {
				maxProg = menu.prog;
			}
			$scope.treeInTheDBExpandedNodes.push(menu);
			$scope.treeInTheDBDisabledNodes.push(menu);

		});

		/* FILE --> DB */
		tmpArray = [];
		angular.copy($scope.menuArrayCopy, tmpArray);
		angular.forEach(tmpArray, function (arrayMenu) {
			var index = $scope.indexInList(arrayMenu, $scope.currentMenuCopy);
			var indexReturnArray = $scope.indexInList(arrayMenu, returnArray);
			if(index==-1 && indexReturnArray==-1){
				var menu = arrayMenu;
				menu.updated = menuToInsertPlaceholder;
				maxProg += 1;
//				menu.prog = maxProg;
				returnArray.push(menu);
				$scope.treeInTheDBExpandedNodes.push(menu);
				$scope.treeInTheDBDisabledNodes.push(menu);
			}
		});
	}
	
	$scope.treeify = function (list, idAttr, parentAttr, childrenAttr) {
	    if (!idAttr) idAttr = 'id';
	    if (!parentAttr) parentAttr = 'parent';
	    if (!childrenAttr) childrenAttr = 'children';

	    var treeList = [];
	    var lookup = {};
	    list.forEach(function(obj) {
	        lookup[obj[idAttr]] = obj;
	        obj[childrenAttr] = [];
	    });
	    list.forEach(function(obj) {
	        if (obj[parentAttr] != null) {
	            lookup[obj[parentAttr]][childrenAttr].push(obj);
	        } else {
	            treeList.push(obj);
	        }
	    });
	    return treeList;
	};

	$scope.parseToTree=function(source,dest){
//		var source = [];
//		angular.copy(sourceArray, source);
		for(var index = 0; index < source.length; index++){
			var tmpEle=source[index];
			if(tmpEle.parentId==null){
				tmpEle.children=[];
				dest.push(tmpEle);
				source.splice(source.indexOf(tmpEle),1);
			}else{
				//controllo se il padre e' presente in dest
				var par=null;
				for(var i=0;i<dest.length;i++){
					var xx=getParentById(dest[i],tmpEle.parentId);
					if(xx!=null){
						par=xx;
						break;
					}
				}
				if(par!=null){
					tmpEle.children=[];
					par.children.push(tmpEle);
					source.splice(source.indexOf(tmpEle),1);
				}
			}
		}
		if(source.length>0){
			$scope.parseToTree(source,dest);
		}
	}



	getParentById = function(element, matchingTitle){
	     if(element.menuId == matchingTitle){
	          return element;
	     }else if (element.children != null){
	          var i;
	          var result = null;
	          for(var i=0; result == null && i < element.children.length; i++){
	               result = getParentById(element.children[i], matchingTitle);
	          }
	          return result;
	     }
	     return null;
	}




	$scope.removeCircularDependences = function(tree){
		for(var i=0;i<tree.length;i++){
			delete tree[i].$parent;
			if(tree[i].children.length!=0){
			//	for(var j=0;j<tree[i].children.length;j++){
					//delete tree[i].children[j].$parent
					$scope.removeCircularDependences(tree[i].children);
			//	}
			}

		}
	};

//	$scope.parseToTree = function(arr, dest){
//		for(var i=0;i<arr.length;i++){
//			if(arr[i].parentId==false || arr[i].parentId==null ){
//				arr[i]["children"]=[];
//				dest.push(arr[i]);
//			}
//		}
//
//		for(var i=0;i<arr.length;i++){
//			if(arr[i].parentId==false ||arr[i].parentId==null  ){
//				//it is  a father, no action
//			}else{
//				//it is a child
//				for(var j=0;j<dest.length;j++){
//					if(dest[j].menuId==arr[i].parentId){
//						//arr[i].parentId=dest[j].name;
//						arr[i]["parentName"]=dest[j].name;
//						dest[j]["children"].push(arr[i]);
//
//					}
//				}
//			}
//		}
//	};
	$scope.checkObjects = function(){
		for(var i=0;i<$scope.menu.length;i++){
			if($scope.menu[i].objId!=null){
				var index = $scope.indexObjectsInList($scope.menu[i],$scope.exportedObjects );
				if(index!=-1){
					var index2 = $scope.indexObjectsInListByLabel($scope.exportedObjects[index],$scope.currentObjects );
					if(index2 == -1){
						//$scope.showAction(sbiModule_translate.load("sbi.importmenu.errormissingobj"));
						sbiModule_messaging.showInfoMessage(sbiModule_translate.load("sbi.importmenu.errormissingobj"),"");
						return false;
					}

				}

			}

		}
		return true;
	};
	$scope.checkRole = function(){

		for(var i=0;i<$scope.exportedRoles.length;i++){
			var index = $scope.indexInList($scope.exportedRoles[i],$scope.currentRoles );
			if(index==-1){
				var text = sbiModule_translate.load("sbi.importusers.importfailed")+$scope.exportedRoles[i].name+" "+sbiModule_translate.load("sbi.importusers.importfailed2");
				//$scope.showAction(text);
				sbiModule_messaging.showInfoMessage(text,"");
				return false;

			}
		}
		//all roles present
		return true;

	};

	$scope.save = function (ev) {
		if ($scope.fileTree.length == 0 && $scope.treeInTheDB.length == 0) {
			//$scope.showAction(sbiModule_translate.load("sbi.importusers.anyuserchecked"))
			sbiModule_messaging.showInfoMessage(sbiModule_translate.load("sbi.importusers.anyuserchecked"), "");
		} else if ($scope.typeSaveMenu == 'Override' || $scope.typeSaveMenu == 'Missing') {
			$scope.removeCircularDependences($scope.fileTree);

			/* Roles association for import procedure */
			$scope.showCircular = true;
			sbiModule_restServices.promisePost("1.0/serverManager/importExport/document", 'associateRoles', getExportedRole())
				.then(function (response) {
						var data = response.data;

						if (data.hasOwnProperty("errors")) {
							$scope.stopImport(data.errors[0].message);
						} else if (data.STATUS == "NON OK") {
							$scope.stopImport(data.ERROR);
						} else if (data.STATUS == "OK") {
							$scope.showCircular = false;

							$scope.showCircular = true;

							var conf = {
								"tree": $scope.fileTree,
								"obj": $scope.exportedObjects,
								"rolesFromFile": $scope.exportedRoles,
								"overwrite": false,
							}
							sbiModule_restServices.promisePost("1.0/serverManager/importExport/menu", "importMenuInDB", conf)
								.then(function (response) {
										var data = response.data;
										if (data.STATUS == "OK") {

											$scope.tree = [];
											$scope.treeCopy = [];
											$scope.treeInTheDB = [];
											$scope.fileTree = [];
											$scope.fileTreeExpandedNodes = [];
											$scope.fileTreeDisabledNodes = [];
											$scope.treeInTheDBExpandedNodes = [];
											$scope.treeInTheDBDisabledNodes = [];
											
											$scope.docRelToMenu = data.documentsNotInTheDestinationDB;

											if ($scope.docRelToMenu.length > 0) {
												var parentEl = angular.element(document.body);
												$mdDialog.show({
													parent: parentEl,
													controller: function(scope, $mdDialog, translate, docRelToMenu) {
														scope.translate = translate;
														scope.docRelToMenu = docRelToMenu;
														
														scope.closeDialog = function() {
															$mdDialog.hide();
													    }
													},
													locals: {
														translate: sbiModule_translate,
														docRelToMenu: $scope.docRelToMenu,
													},
													templateUrl: sbiModule_config.contextName + '/js/src/angular_1.4/tools/servermanager/menuImportExport/templates/importMenuDocAssociationDialog.html',
													clickOutsideToClose: true,
													escapeToClose: true,
													fullscreen: true
												}).then(function() {
													$scope.showConfirm(sbiModule_translate.load("sbi.importusers.importuserok"));
													$scope.resetBreadcrumbs();
													$scope.finishImport();
											    }, function() {

											    });;
											} else {
												$scope.showConfirm(sbiModule_translate.load("sbi.importusers.importuserok"));

												$scope.resetBreadcrumbs();
												
												$scope.finishImport();
											}

											
											//						$scope.stopImportWithDownloadAss($scope.translate.load("sbi.importusers.importuserokdownloadass"),data.folderName, data.associationsName);
											//reload tree
											//					$scope.reload();

										} else {
											//$scope.showAction(data.ERROR)
											sbiModule_restServices.errorHandler(data.ERROR, "sbi.generic.toastr.title.error");
										}
									},
									function (response) {
										var data = response.data;
										$scope.stopImport(data);
									});
						}
					},
					function (response) {
						var data = response.data;
						$scope.stopImport(data);
					});
		} else if ($scope.tree.length != 0) {
			//$scope.showAction(sbiModule_translate.load("sbi.importmenu.selectmode"));
			sbiModule_messaging.showInfoMessage(sbiModule_translate.load("sbi.importmenu.selectmode"), "");
		}

	};
	
	$scope.reload = function(){

		sbiModule_restServices.get("1.0/serverManager/importExport/menu","getAllMenu")
		.success(function(data, status, headers, config) {

			/* BACKUP */
			$scope.menuArrayCopy = [];
			angular.copy($scope.menu, $scope.menuArrayCopy);
			$scope.currentMenuCopy = [];
			angular.copy($scope.currentMenu, $scope.currentMenuCopy);

			$scope.currentMenu = [];
			$scope.currentMenu = data.currentMenu;
			$scope.parseToTree($scope.currentMenu,$scope.treeInTheDB);

			$scope.treeInTheDB= [];
			$scope.parseToTree($scope.currentMenuCopy,$scope.treeInTheDB);
			$scope.treeCopy=$scope.treeInTheDB;

		}).error(function(data, status, headers, config) {
			console.log("ERRORS "+status,4000);
		})
	};

	$scope.reloadTree = function(value) {
		if(value == 'Missing'){
			angular.copy($scope.menuArrayCopy, $scope.menu);
			for(var i=0;i<$scope.menu.length;i++){
				var index = $scope.indexInList($scope.menu[i],$scope.currentMenu );
				if(index==-1){
					if($scope.menu[i].parentId!=null){
						$scope.menu[i].parentId = "id"+$scope.menu[i].parentId;
					}else{
						$scope.menu[i].menuId = "id"+$scope.menu[i].menuId;
					}
					$scope.currentMenu.push($scope.menu[i]);
				}
			}

			$scope.treeInTheDB=[];
			$scope.parseToTree($scope.currentMenu, $scope.treeInTheDB)
		}else{
			$scope.treeInTheDB = $scope.tree;
		}
	};




//	$scope.removeCircularDependences = function(tree){
//		for(var i=0;i<tree.length;i++){
//			delete tree[i].$parent;
//			if(tree[i].children.length!=0){
//				for(var j=0;j<tree[i].children.length;j++){
//					delete tree[i].children[j].$parent
//				}
//			}
//
//		}
//	};
	
	$scope.roleInAssociatedRoles = function (role, list) {
		var i = 0;
		for (var assRoleId in list) {
			if (list[assRoleId].name==role.name) {
				return i; 
			}
			i++;
		}
		
		return -1;
	};

	$scope.indexInList=function(item, list) {

		for (var i = 0; i < list.length; i++) {
			var object = list[i];
			if(object.name==item.name){
				return i;
			}
		}

		return -1;
	};
	$scope.indexObjectsInList=function(item, list) {

		for (var i = 0; i < list.length; i++) {
			var object = list[i];
			if(object.id==item.objId){
				return i;
			}
		}

		return -1;
	};


	$scope.indexObjectsInListByLabel = function(item, list){
		for (var i = 0; i < list.length; i++) {
			var object = list[i];
			if(object.label==item.label){
				return i;
			}
		}

		return -1;
	}
	$scope.showConfirm = function(text) {
	    // Appending dialog to document.body to cover sidenav in docs app
	    var confirm = $mdDialog.alert()
	          .title(text)
	          .ariaLabel('Lucky day')
	          .ok('Ok')

	    $mdDialog.show(confirm).then(function() {

	    }, function() {

	    });
	  };

		$scope.showAction = function(text) {
			var toast = $mdToast.simple()
			.content(text)
			.action('OK')
			.highlightAction(false)
			.hideDelay(3000)
			.position('top')

			$mdToast.show(toast).then(function(response) {

				if ( response == 'ok' ) {


				}
			});
		};

		$scope.goAhead = function() {
			$scope.selectedStep += 1;
			$scope.stepControl.insertBread({name: sbiModule_translate.load('SBISet.impexp.exportedRoles','component_impexp_messages')});
		}
		
		$scope.resetBreadcrumbs = function() {
			$scope.stepControl.resetBreadCrumb();
			$scope.stepControl.insertBread({name: $scope.translate.load('sbi.ds.file.upload.button')});
			$scope.selectedStep = 0;
		}

		$scope.currentRoleIsSelectable=function(role,exprole){
			var roleinl=$scope.roleInAssociatedRoles(role, $scope.IEDConf.roles.associatedRoles);
			if(roleinl!=-1 && roleinl!=exprole.id){
				return false;
			}
			return true;

		}
		
		$scope.finishImport=function(){
			if(importExportMenuModule_importConf.hasOwnProperty("resetData")){
				importExportMenuModule_importConf.resetData();
			}
			$scope.importFile = {};
		}
		
		function getExportedRole(){
			var expr=[];
			for(var key in importExportMenuModule_importConf.roles.associatedRoles){
				expr.push({roleAssociateId:importExportMenuModule_importConf.roles.associatedRoles[key].id,expRoleId:key});
			}
			return expr;
		}
		
		$scope.stopImport=function(text){
			 var alert = $mdDialog.alert()
					.title('')
					.content(text)
					.ariaLabel('error import')
					.ok('OK');
			$mdDialog.show(alert).then(function() {
				$scope.resetBreadcrumbs();
			} );
		}
		
		$scope.stopImportWithDownloadAss=function(text, folderAss, fileAss){
			var folder = folderAss;
			var file = fileAss;

			var confirm = $mdDialog.confirm()
			.title('')
			.content(text)
			.ariaLabel('error import')
			.ok(sbiModule_translate.load("sbi.general.yes"))
			.cancel(sbiModule_translate.load("sbi.general.No"));

			$mdDialog.show(confirm).then(function() {
				// choose to download association xml
				var data={"FILE_NAME":file, "FOLDER_NAME":folder};
				var config={"responseType": "arraybuffer"};

				sbiModule_restServices.promisePost("1.0/serverManager/importExport/document","downloadAssociationsFile",data,config)
				.then(function(response) {
					if (response.data.hasOwnProperty("errors")) {
					sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");

					$scope.stepControl.resetBreadCrumb();
					$scope.stepControl.insertBread({name: $scope.translate.load('sbi.ds.file.upload.button')});
					$scope.finishImport();
				}else {
					// download association file
					$scope.download.getBlob(response.data,file,'text/xml','xml');

					$scope.stepControl.resetBreadCrumb();
					$scope.stepControl.insertBread({name: $scope.translate.load('sbi.ds.file.upload.button')});
					$scope.finishImport();

					}
				}, function(response) {
					sbiModule_restServices.errorHandler(response.data.errors[0].message,"sbi.generic.toastr.title.error");
				});
		
			},
				function() {
				$scope.stepControl.resetBreadCrumb();
					$scope.stepControl.insertBread({name: $scope.translate.load('sbi.ds.file.upload.button')});
					$scope.finishImport();
			});
		}
		
		$scope.listAssociation = function(){
			$mdDialog.show({
				controller: $scope.dialogController ,
				templateUrl: sbiModule_config.dynamicResourcesBasePath + '/angular_1.4/tools/servermanager/documentImportExport/templates/importExportListAssociation.html',
				parent: angular.element(document.body),
				locals : {
					translate : $scope.translate,
					browser : sbiModule_device.browser,
					showToast:$scope.showToast,
					sbiModule_download:sbiModule_download
				},
				preserveScope : true,
				clickOutsideToClose:true
			})
			.then(function(associationSelected){
				importExportMenuModule_importConf.fileAssociation = associationSelected;
			}, function(){

			});
		}
		
		$scope.toogleViewInsertForm = function (){
			$scope.viewInsertForm = !$scope.viewInsertForm;
			if (!$scope.viewInsertForm){
				//reset values
				$scope.associationSelected = {};
				$scope.associationFile = {};
			}
		}
		$scope.cancel = function() {
			$mdDialog.cancel();
		};
		
		$scope.dialogController =function ($scope, $mdDialog, translate,browser,showToast,sbiModule_download) {
			$scope.translate = translate;
			$scope.showToast=showToast;
			$scope.viewInsertForm=false;
			$scope.associationFile = {};
			//"[{"id":"quiiiii","name":"quiiiii","description":"assadsad","dateCreation":1452788706189}]"
			$scope.associations = [];
			$scope.associationSelected = {};
			$scope.addAssociationForm={"file":{}};
			$scope.isIE= (browser.name == 'internet explorer');

			$scope.SpeedMenuOpt  = [
			                        {
					            		label : 'delete',
					            		 icon:'fa fa-minus-circle' ,  
					            		backgroundColor:'red',  
					            		 color:'black',		
					            		action : function(item,event) {
//					            				myFunction(event,item);
					            			$scope.deleteAssociationsFile(item);
					            		 }
					            	}, {
					            		label : 'download',
					            		 icon:'fa fa-download' ,  
					            		backgroundColor:'green',  
					            		 color:'black',		
					            		action : function(item,event) {
//					            				myFunction(event,item);
					            			$scope.downloadAssociationsFile(item);
					            		 }
					            	}
			            ];

			
			
			sbiModule_restServices.get("1.0/serverManager/importExport/document", 'associationsList/get')
			.success(function(data, status, headers, config) {
				$scope.associations=data.associationsList;
			})
			.error(function(data, status, headers, config) {
				sbiModule_restServices.errorHandler("Errore nel recuperare i file di associazione","sbi.generic.toastr.title.error");
			});
					
			$scope.toogleViewInsertForm = function (){
				$scope.viewInsertForm = !$scope.viewInsertForm;
				if (!$scope.viewInsertForm){
					//reset values
					$scope.associationSelected = {};
					$scope.associationFile = {};
				}
			}
			$scope.cancel = function() {
				$mdDialog.cancel();
			};

			$scope.saveListAssociationFile = function(){
				
				var fd = new FormData();
				fd.append('name', $scope.addAssociationForm.name);
				fd.append('description', $scope.addAssociationForm.description);
				fd.append('file', $scope.addAssociationForm.file.file);
				
				sbiModule_restServices.post("1.0/serverManager/importExport/document", 'associationsList/upload', fd, {transformRequest: angular.identity,headers: {'Content-Type': undefined}})
				.success(function(data, status, headers, config) {
					
					if(data.STATUS=="NON OK"){
						sbiModule_restServices.errorHandler(data.ERROR,"sbi.generic.toastr.title.error");
					}
					else if(data.STATUS=="OK"){
						$scope.associations.push(data.associationsFile);
						$scope.toogleViewInsertForm ();
						$scope.addAssociationForm={"file":{}};
					}
					
					
				})
				.error(function(data, status, headers, config) {
					sbiModule_restServices.errorHandler(data,"sbi.generic.toastr.title.error");
				});
				
				
			}

			$scope.downloadAssociationsFile=function(item){
				
				sbiModule_restServices.post("1.0/serverManager/importExport/document", 'associationsList/download',{'id':item.name},{"responseType": "arraybuffer"})
				.success(function(data, status, headers, config) {
					if (data.hasOwnProperty("errors")) {
						sbiModule_restServices.errorHandler(data.errors[0].message,"sbi.generic.toastr.title.error");
					}else if (data.hasOwnProperty("NON OK")) {
						sbiModule_restServices.errorHandler(data.ERROR,"sbi.generic.toastr.title.error");
					}else if(status==200){
						sbiModule_download.getBlob(data,item.name,'application/xml','xml');
					
					}
				})
				.error(function(data, status, headers, config) {
					sbiModule_restServices.errorHandler(data,"sbi.generic.toastr.title.error");
					
				});
			}
			
	$scope.deleteAssociationsFile=function(item){
		sbiModule_restServices.post("1.0/serverManager/importExport/document", 'associationsList/delete',{'id':item.name})
			.success(function(data, status, headers, config) {
				console.log(data)
					$scope.associations.splice($scope.associations.indexOf(item),1);
				})
			.error(function(data, status, headers, config) {
				sbiModule_restServices.errorHandler(data,"sbi.generic.toastr.title.error");
				
			});
			}
			$scope.selectAssociation = function() {
				$mdDialog.hide($scope.associationSelected);
			};
		}
};

app.controller('exportController', exportFuncController);

function exportFuncController($http,sbiModule_download,sbiModule_device,$scope,$mdDialog,$timeout, sbiModule_logger, sbiModule_translate, sbiModule_restServices,sbiModule_config,$mdToast) {

	$scope.pathRest = { // /restful-services/1.0/menu/enduser
		restfulServices : '1.0',
		menuPath : 'menu/enduser',
	};

	$scope.restServices = sbiModule_restServices;
	$scope.download = sbiModule_download;
	$scope.log = sbiModule_logger;
	$scope.selected = [] ;
	$scope.customs = [];
	$scope.menu=[];
	$scope.fileAssociation = {};
	$scope.selectedNodes = [];
	$scope.expandedNodes = [];

	$scope.flags = {
		waitExport : false,
		enableDownload : false
	};

	$scope.checkboxs = {
		exportSubObj : false,
		exportSnapshots : false
	};

	$scope.exportFiles = function(){
		if ($scope.selectedNodes.length == 0) {
			$scope.showConfirm(sbiModule_translate.load("sbi.importmenu.selectAtLeastOneMenu"));
		} else {
				
			$scope.flags.waitExport = true;
			$scope.removeCircularDependences($scope.selectedNodes);
			sbiModule_restServices.post('1.0/serverManager/importExport/menu', 'export',
				{'EXPORT_FILE_NAME': $scope.exportName,
				'EXPORT_SELECTED_MENU': $scope.selectedNodes},
				{'responseType': 'arraybuffer'}
				)
			.success(function(data, status, headers, config) {
				if (data.hasOwnProperty('errors')) {
					sbiModule_restServices.errorHandler(data.errors[0].message,"sbi.generic.toastr.title.error");
				}else if(status==200){
					$scope.flags.enableDownload = true;
					$scope.downloadedFileName = $scope.exportName;
					$scope.download.getBlob(data, $scope.exportName, 'application/zip', 'zip');
					$scope.flags.enableDownload = false
				}
				$scope.flags.waitExport = false;
			}).error(function(data, status, headers, config) {
				$scope.flags.waitExport = false;
				sbiModule_restServices.errorHandler("Errors","sbi.generic.toastr.title.error");
			})
		}
	};

	var loadAllMenu = function(){
		$scope.flags.waitExport = true;

		sbiModule_restServices.get('1.0/serverManager/importExport/menu', 'getAllMenu')
		.success(function(data, status, headers, config) {
			if (data.hasOwnProperty('errors')) {
				sbiModule_restServices.errorHandler(data.errors[0].message,"sbi.generic.toastr.title.error");
			}else if(status==200){
//				$scope.menu = data.currentMenu;
//				$scope.parseToTree(data.currentMenu,$scope.tree);
				
				$scope.tree = $scope.treeify(data.currentMenu, 'menuId', 'parentId');
			}
			$scope.flags.waitExport = false;
		}).error(function(data, status, headers, config) {
			$scope.flags.waitExport = false;
			sbiModule_restServices.errorHandler("Errors","sbi.generic.toastr.title.error");
		})
	};

	loadAllMenu();
	
	$scope.selectAll = function() {
		var tmp = $scope.flatten($scope.tree, "menuId", "parentId");
		$scope.selectedNodes = tmp;
		$scope.expandedNodes = tmp;
	}
	
	$scope.deselectAll = function() {

		$scope.selectedNodes = [];		
		$scope.expandedNodes = $scope.flatten($scope.tree, "menuId", "parentId");
	}

	$scope.submitDownForm = function(form){
		$scope.flags.submitForm= true;
	};

	$scope.toggleEnableDownload = function(){
		$scope.flags.enableDownload = !$scope.flags.enableDownload;
	};




//	$scope.showAlert = function (title, message){
//		$mdDialog.show(
//				$mdDialog.alert()
//				.parent(document.body)
//				.clickOutsideToClose(true)
//				.title(title)
//				.textContent(message) //FROM angular material 1.0
//				.ok('Ok')
//		);
//	};

	$scope.debug= function(){
	};

//	function showToast(text, time) {
//		var timer = time == undefined ? 6000 : time;
//
//		$mdToast.show(
//				$mdToast
//				.simple()
//				.content(text)
//				.position('top')
//				.action('OK')
//				.highlightAction(false)
//				.hideDelay(timer)
//		);
//	};

	$scope.treeOptions = {
		    nodeChildren: "children",
		    dirSelectable: true,
		    multiSelection: true		  
		}

		
	$scope.showSelected = function (node, selected) {
		
		if (!selected) {
			if ($scope.atLeastOneChildSelected(node)) {
				if ($scope.selectedNodes.indexOf(node) == -1) {
					$scope.selectedNodes.push(node);
					$scope.showConfirm(sbiModule_translate.load("sbi.importmenu.cannotdeselectmenu"));
				}
			}
		}else {
			if ($scope.selectParents) {
				$scope.selectAllParents(node,selected);
			}
	
			$scope.openAndSelectUntilLeaf(node,selected, $scope.selectChildren);
		}
	}
	
	$scope.atLeastOneChildSelected = function(node) {
		if ($scope.selectedNodes.indexOf(node) != -1) {
			return true;
		}
		
		for(var i=0; i < node.children.length; i++) {
			if ($scope.atLeastOneChildSelected(node.children[i])) {
				return true;
			}
		}
		
		return false;
	}

	$scope.selectAllParents = function (node, selected) {
		if (selected) {
			if (node.parentId) {
				var parentNode = getNodeById($scope.tree, node.parentId)
				
				if (parentNode) {
					$scope.selectAllParents(parentNode, selected);
				}
			}

			if ($scope.selectedNodes.indexOf(node) == -1) {
				$scope.selectedNodes.push(node);
			}
		}
	}
	
	getNodeById = function(tree, matchingId){
		var node = null;
		for(var i=0; i < tree.length; i++){
			node = getParentById(tree[i], matchingId);
			if (node) {
				return node;
			}
		};
		return node;
	}


	$scope.openAndSelectUntilLeaf = function (node, selected, selectChildren) {

		angular.forEach(node.children, function (child) {
			$scope.openAndSelectUntilLeaf(child, selected, selectChildren);

			if (selected) {
				if (selectChildren && $scope.selectedNodes.indexOf(child) == -1) {
					$scope.selectedNodes.push(child);
				}
			} else {
				if (selectChildren && $scope.selectedNodes.indexOf(child) != -1) {
					$scope.selectedNodes.splice($scope.selectedNodes.indexOf(child) ,1);
				}
			}

			if ($scope.expandedNodes.indexOf(child) == -1) {
				$scope.expandedNodes.push(child);
			}
		});

		if ($scope.expandedNodes.indexOf(node) == -1) {
			$scope.expandedNodes.push(node);
		}

	}
	
	$scope.flatten = function (treeObj, idAttr, parentAttr, childrenAttr, levelAttr) {
	    if (!idAttr) idAttr = 'id';
	    if (!parentAttr) parentAttr = 'parent';
	    if (!childrenAttr) childrenAttr = 'children';
	    if (!levelAttr) levelAttr = 'level';

	    var result = [];
	    
	    for (var i =0 ; i< treeObj.length; i++) {
	    	$scope.treeToArray(treeObj[i], childrenAttr, result);
	    }
	    
	    return result;
	};
	
	$scope.treeToArray = function(treeNode, childrenAttr, result) {
		result.push(treeNode);
		
		if (treeNode.children.length > 0) {
			for (var i = 0; i < treeNode[childrenAttr].length; i++) {
				$scope.treeToArray(treeNode[childrenAttr][i], childrenAttr, result);
			}
		}			
	}
	
};

app.controller('importController',
		['sbiModule_download',
		 'sbiModule_device',
		 '$scope',
		 '$mdDialog',
		 '$timeout',
		 'sbiModule_logger',
		 'sbiModule_translate',
		 'sbiModule_restServices',
		 'sbiModule_config',
		 '$mdToast',
		 'importExportMenuModule_importConf',
		 importFuncController]);

function importFuncController(
		sbiModule_download,
		sbiModule_device,
		$scope,
		$mdDialog,
		$timeout,
		sbiModule_logger,
		sbiModule_translate,
		sbiModule_restServices,
		sbiModule_config,
		$mdToast,
		importExportMenuModule_importConf) {

	$scope.stepItem = [{name: $scope.translate.load('sbi.ds.file.upload.button')}];
	$scope.selectedStep = 0;
	$scope.stepControl;
	$scope.IEDConf = importExportMenuModule_importConf;
	
};
