# PlayerService Migration & Parent Assignment - Implementation Plan

## Overview
This plan covers TWO major refactorings:
1. **PlayerService Migration**: Update from OLD User-based architecture to NEW standalone Player entity
2. **Parent Assignment Feature**: Implement proper parent-child relationships using User entity references (Option B - Clean Architecture)

## PHASE 1: PlayerService Migration (Core Architecture Fix)

### Required Changes

### 1. Update Imports
```java
// Remove these imports (no longer needed):
import com.batal.entity.enums.UserType;
import com.batal.entity.enums.Level;

// PlayerDTO, Player entity already correct
```

### 2. Update Repository Calls

**OLD (User-based):**
```java
userRepository.findByUserType(UserType.PLAYER, pageable)
userRepository.findPlayerByIdWithGroup(id)
```

**NEW (Player-based):**
```java
playerRepository.findAllWithGroup(pageable)
playerRepository.findByIdWithGroup(id)
```

### 3. Update createPlayer() Method

**Changes needed:**
- Remove password encoding (players don't authenticate)
- Remove role assignment (no PLAYER role)
- Work directly with Player entity (not User)
- Set all fields directly on Player

**Before:**
```java
User player = new User();
player.setUserType(UserType.PLAYER);
player.setPassword(encodedPassword);
// ... set fields on User
userRepository.save(player);
```

**After:**
```java
Player player = new Player();
player.setFirstName(dto.getFirstName());
player.setLastName(dto.getLastName());
// ... set ALL fields directly on Player
playerRepository.save(player);
```

### 4. Update Conversion Methods

**convertToDTO():**
- Access fields directly from Player (not via player.getUser())
- player.getFirstName() instead of player.getUser().getFirstName()

**convertToEntity():**
- Set fields directly on Player
- No User entity involved

### 5. Update All Query Methods

Replace:
```java
userRepository.findByUserType(UserType.PLAYER, ...)
```

With:
```java
playerRepository.findAll...()
```

### 6. Remove Password-Related Methods
- changePlayerPassword() - NO LONGER NEEDED (players don't login)
- Any authentication logic

### 7. Update Group Assignment
**Before:**
```java
user.setGroup(group);
```

**After:**
```java
player.setGroup(group);
```

## Files That Use PlayerService

1. **PlayerController.java** - Will need testing after PlayerService update
2. **GroupService.java** (possibly) - May reference PlayerService
3. **AssessmentService.java** (possibly) - May reference players

## PHASE 2: Parent Assignment Feature (Option B - Clean Architecture)

### Overview
Remove legacy `parentName` String field and implement proper User entity relationships for parent-child associations.

### 1. Update PlayerDTO

**File: `PlayerDTO.java`**

**REMOVE:**
```java
@NotBlank(message = "Parent name is required")
@Size(max = 200, message = "Parent name must not exceed 200 characters")
private String parentName;

public String getParentName() { return parentName; }
public void setParentName(String parentName) { this.parentName = parentName; }
```

**ADD:**
```java
// Parent relationship (User entity reference)
private Long parentId;
private String parentName;  // Computed field for display only (from parent.getFullName())

public Long getParentId() { return parentId; }
public void setParentId(Long parentId) { this.parentId = parentId; }

// Keep getter/setter for parentName but make it computed (no @NotBlank validation)
public String getParentName() { return parentName; }
public void setParentName(String parentName) { this.parentName = parentName; }
```

**ADD missing Player-specific fields:**
```java
@Size(max = 10)
private String playerNumber;

@Size(max = 50)
private String position;

public String getPlayerNumber() { return playerNumber; }
public void setPlayerNumber(String playerNumber) { this.playerNumber = playerNumber; }

public String getPosition() { return position; }
public void setPosition(String position) { this.position = position; }
```

### 2. Update PlayerService - Parent Assignment

**File: `PlayerService.java`**

**In createPlayer() method - Add parent assignment:**
```java
// After setting all player fields, before saving:
if (playerDTO.getParentId() != null) {
    User parent = userRepository.findById(playerDTO.getParentId())
        .orElseThrow(() -> new RuntimeException("Parent not found with id: " + playerDTO.getParentId()));

    // Validate parent is actually a PARENT user type
    if (parent.getUserType() != UserType.PARENT) {
        throw new RuntimeException("User with id " + playerDTO.getParentId() + " is not a parent");
    }

    player.setParent(parent);
}
```

**In updatePlayerFields() method - Add parent update:**
```java
// Update parent relationship if provided
if (dto.getParentId() != null) {
    User parent = userRepository.findById(dto.getParentId())
        .orElseThrow(() -> new RuntimeException("Parent not found with id: " + dto.getParentId()));

    if (parent.getUserType() != UserType.PARENT) {
        throw new RuntimeException("User with id " + dto.getParentId() + " is not a parent");
    }

    player.setParent(parent);
} else {
    player.setParent(null);  // Allow un-assigning parent
}
```

**In convertToDTO() method - Add parent info:**
```java
// Set parent information (already exists, verify it's correct)
if (player.getParent() != null) {
    dto.setParentId(player.getParent().getId());
    dto.setParentName(player.getParent().getFullName());
}
```

### 3. Fix UserService - PARENT Role Assignment

**File: `UserService.java`**

**In createUser() method switch statement (around line 116-128):**
```java
switch (request.getUserType()) {
    case COACH:
        defaultRoleName = "COACH";
        break;
    case ADMIN:
        defaultRoleName = "ADMIN";
        break;
    case MANAGER:
        defaultRoleName = "MANAGER";
        break;
    case PARENT:  // ADD THIS CASE
        defaultRoleName = "PARENT";
        break;
    default:
        defaultRoleName = "COACH";
        break;
}
```

### 4. Add Parent Management Endpoints (Optional)

**New File: `ParentController.java`**

```java
@RestController
@RequestMapping("/api/parents")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ParentController {

    @Autowired
    private UserService userService;

    @Autowired
    private PlayerRepository playerRepository;

    /**
     * Create a new parent user
     * Only ADMIN and MANAGER can create parents
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> createParent(@Valid @RequestBody UserCreateRequest request) {
        // Force user type to PARENT
        request.setUserType(UserType.PARENT);

        try {
            UserResponse parent = userService.createUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(parent);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to create parent", "message", e.getMessage()));
        }
    }

    /**
     * Get all parents
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<UserResponse>> getAllParents() {
        List<UserResponse> parents = userService.getUsersByRole("PARENT");
        return ResponseEntity.ok(parents);
    }

    /**
     * Get parent's children
     */
    @GetMapping("/{parentId}/children")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('COACH')")
    public ResponseEntity<List<PlayerDTO>> getParentChildren(@PathVariable Long parentId) {
        List<Player> children = playerRepository.findByParentIdWithGroup(parentId);
        // Convert to DTOs...
        return ResponseEntity.ok(playerDTOs);
    }

    /**
     * Assign parent to player
     */
    @PostMapping("/{parentId}/assign-player/{playerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> assignParentToPlayer(
            @PathVariable Long parentId,
            @PathVariable Long playerId) {
        // Implementation...
        return ResponseEntity.ok(updatedPlayer);
    }
}
```

### 5. Database Migration (if needed)

**Check if `players.parent_id` column exists:**
```sql
-- Should already exist from V33__Restructure_for_parent_login.sql
-- Verify with:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players' AND column_name = 'parent_id';
```

## Implementation Order

### Step 1: PlayerService Core Migration
1. Remove unused imports (UserType for player context, Role, RoleRepository)
2. Remove unused dependencies (UserRepository, RoleRepository, PasswordEncoder, playerDefaultPassword)
3. Fix `promotePlayerToAdvanced()` method (player.getUser() → player)
4. Fix `updatePlayerFields()` method (update Player directly, not User)
5. Delete `createUserForPlayer()` method
6. Delete `changePlayerPassword()` method
7. Add `findByEmailWithGroup()` to PlayerRepository
8. Fix `mapSortField()` in PlayerController (user.firstName → firstName)

### Step 2: PlayerDTO Enhancement
1. Add `parentId` field (Long)
2. Make `parentName` non-required (remove @NotBlank)
3. Add `playerNumber` field (String)
4. Add `position` field (String)

### Step 3: Parent Assignment Implementation
1. Update `createPlayer()` to handle parent assignment
2. Update `updatePlayerFields()` to handle parent updates
3. Update `convertToDTO()` to include parent info
4. Fix UserService PARENT role assignment

### Step 4: Parent Management (Optional)
1. Create ParentController
2. Add parent creation endpoint
3. Add parent listing endpoint
4. Add parent-child assignment endpoints

### Step 5: Frontend Updates (if applicable)
1. Update player creation form to select parent from dropdown
2. Update player edit form to change parent assignment
3. Add parent management UI

## Testing Checklist

### Phase 1 - PlayerService Migration:
- [ ] Create player (no password needed)
- [ ] Get all players with pagination
- [ ] Get all players with search
- [ ] Get player by ID
- [ ] Get player by email
- [ ] Update player
- [ ] Deactivate/reactivate player
- [ ] Delete player
- [ ] Search players by name
- [ ] Get players by group
- [ ] Get unassigned players
- [ ] Auto-assign player to group
- [ ] Promote player to Advanced level
- [ ] Sorting by firstName, lastName, email works

### Phase 2 - Parent Assignment:
- [ ] Create player with parent assignment
- [ ] Create player without parent (optional)
- [ ] Update player's parent
- [ ] Remove parent from player (set to null)
- [ ] Parent can view their children via ParentService
- [ ] Get parent's children list
- [ ] Create parent user with PARENT role
- [ ] Validate parent user type on assignment
- [ ] Frontend displays parent name correctly

## Files to Modify

### Phase 1:
1. `backend/src/main/java/com/batal/service/PlayerService.java` (~150 line changes)
2. `backend/src/main/java/com/batal/controller/PlayerController.java` (~10 lines)
3. `backend/src/main/java/com/batal/repository/PlayerRepository.java` (add 1 method)

### Phase 2:
1. `backend/src/main/java/com/batal/dto/PlayerDTO.java` (~20 lines)
2. `backend/src/main/java/com/batal/service/PlayerService.java` (~30 lines)
3. `backend/src/main/java/com/batal/service/UserService.java` (~3 lines)
4. `backend/src/main/java/com/batal/controller/ParentController.java` (new file, ~100 lines)

## Risk Assessment

**Low Risk:**
- Adding missing repository methods
- Fixing sorting in controller
- Adding parent assignment (new feature)

**Medium Risk:**
- Updating PlayerService core methods (well-tested functionality)
- Changing PlayerDTO structure (may affect API contracts)
- Removing password-related methods (ensure not used elsewhere)

**Mitigation:**
- Test each phase independently
- Keep git commits atomic (one feature per commit)
- Run full test suite after each phase
- Verify API contracts with frontend team
