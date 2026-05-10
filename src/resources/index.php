
<?php
ini_set('display_errors',1); error_reporting(E_ALL);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(200); exit();}

$method = $_SERVER['REQUEST_METHOD'];
$rawData = file_get_contents('php://input');
$data = json_decode($rawData,true);
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$resource_id = $_GET['resource_id'] ?? null;
$comment_id = $_GET['comment_id'] ?? null;

require_once './config/Database.php';
$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dsn = 'mysql:host=localhost;dbname=course;charset=utf8mb4';
$dbUser = 'root';
$dbPass = '';

try {
    $db = new PDO($dsn, $dbUser, $dbPass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$resource_id = $_GET['resource_id'] ?? null;
$comment_id = $_GET['comment_id'] ?? null;

// --- Helper Functions ---
function sendResponse($data, $status = 200){
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// --- Resource Functions ---
function getAllResources($db){
    $stmt = $db->query("SELECT * FROM resources ORDER BY created_at DESC");
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(['success'=>true,'data'=>$resources]);
}

function getResourceById($db, $id){
    if(!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid ID'],400);
    $stmt = $db->prepare("SELECT * FROM resources WHERE id=?");
    $stmt->execute([$id]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    if($res) sendResponse(['success'=>true,'data'=>$res]);
    sendResponse(['success'=>false,'message'=>'Resource not found'],404);
}

function createResource($db,$data){
    if(empty($data['title']) || empty($data['link'])) sendResponse(['success'=>false,'message'=>'Missing fields'],400);
    $title = trim($data['title']);
    $desc = trim($data['description'] ?? '');
    $link = trim($data['link']);
    if(!filter_var($link,FILTER_VALIDATE_URL)) sendResponse(['success'=>false,'message'=>'Invalid URL'],400);
    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?,?,?)");
    if($stmt->execute([$title,$desc,$link])){
        sendResponse(['success'=>true,'id'=>$db->lastInsertId()],201);
    }
    sendResponse(['success'=>false,'message'=>'Insert failed'],500);
}

function updateResource($db,$data){
    if(empty($data['id'])) sendResponse(['success'=>false,'message'=>'Missing ID'],400);
    $id = $data['id'];
    $stmt = $db->prepare("SELECT * FROM resources WHERE id=?");
    $stmt->execute([$id]);
    if(!$stmt->fetch(PDO::FETCH_ASSOC)) sendResponse(['success'=>false,'message'=>'Resource not found'],404);

    $fields=[];$values=[];
    if(isset($data['title'])) {$fields[]="title=?";$values[]=trim($data['title']);}
    if(isset($data['description'])) {$fields[]="description=?";$values[]=trim($data['description']);}
    if(isset($data['link'])) {
        $link=trim($data['link']);
        if(!filter_var($link,FILTER_VALIDATE_URL)) sendResponse(['success'=>false,'message'=>'Invalid URL'],400);
        $fields[]="link=?";$values[]=$link;
    }
    if(empty($fields)) sendResponse(['success'=>false,'message'=>'Nothing to update'],400);

    $values[]=$id;
    $sql = "UPDATE resources SET ".implode(',',$fields)." WHERE id=?";
    $stmt = $db->prepare($sql);
    if($stmt->execute($values)) sendResponse(['success'=>true,'message'=>'Resource updated']);
    sendResponse(['success'=>false,'message'=>'Update failed'],500);
}

function deleteResource($db,$id){
    if(!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid ID'],400);
    $stmt = $db->prepare("DELETE FROM resources WHERE id=?");
    if($stmt->execute([$id]) && $stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Resource deleted']);
    sendResponse(['success'=>false,'message'=>'Resource not found'],404);
}

// --- Comment Functions ---
function getComments($db,$resource_id){
    if(!is_numeric($resource_id)) sendResponse(['success'=>false,'message'=>'Invalid ID'],400);
    $stmt=$db->prepare("SELECT * FROM comments_resource WHERE resource_id=? ORDER BY created_at ASC");
    $stmt->execute([$resource_id]);
    $comments=$stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(['success'=>true,'data'=>$comments]);
}

function createComment($db,$data){
    if(empty($data['resource_id'])||empty($data['author'])||empty($data['text'])) sendResponse(['success'=>false,'message'=>'Missing fields'],400);
    $rid=$data['resource_id'];$author=trim($data['author']);$text=trim($data['text']);
    if(!is_numeric($rid)) sendResponse(['success'=>false,'message'=>'Invalid resource ID'],400);
    $stmt=$db->prepare("SELECT id FROM resources WHERE id=?");
    $stmt->execute([$rid]);
    if(!$stmt->fetch(PDO::FETCH_ASSOC)) sendResponse(['success'=>false,'message'=>'Resource not found'],404);
    $stmt=$db->prepare("INSERT INTO comments_resource (resource_id,author,text) VALUES (?,?,?)");
    if($stmt->execute([$rid,$author,$text])) sendResponse(['success'=>true,'id'=>$db->lastInsertId()],201);
    sendResponse(['success'=>false,'message'=>'Insert failed'],500);
}

function deleteComment($db,$id){
    if(!is_numeric($id)) sendResponse(['success'=>false,'message'=>'Invalid ID'],400);
    $stmt=$db->prepare("DELETE FROM comments_resource WHERE id=?");
    if($stmt->execute([$id]) && $stmt->rowCount()>0) sendResponse(['success'=>true,'message'=>'Comment deleted']);
    sendResponse(['success'=>false,'message'=>'Comment not found'],404);
}

// --- Main Router ---
try{
    switch($method){
        case 'GET':
            if($action==='comments' && $resource_id) getComments($db,$resource_id);
            elseif($id) getResourceById($db,$id);
            else getAllResources($db);
            break;
        case 'POST':
            if($action==='comment') createComment($db,$data);
            else createResource($db,$data);
            break;
        case 'PUT':
            updateResource($db,$data);
            break;
        case 'DELETE':
            if($action==='delete_comment' && $comment_id) deleteComment($db,$comment_id);
            else deleteResource($db,$id);
            break;
        default:
            sendResponse(['success'=>false,'message'=>'Method not allowed'],405);
    }
}catch(Exception $e){
    error_log($e->getMessage());
    sendResponse(['success'=>false,'message'=>'Server error'],500);
}
?>