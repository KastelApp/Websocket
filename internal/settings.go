package internal

import "math/big"

type MaxSettings struct {
	GuildCount             int
	ChannelCount           int
	RoleCount              int
	InviteCount            int
	BanCount               int
	FriendCount            int
	MemberCount            int
	UsernameCount          int
	GuildNameLength        int
	GuildDescriptionLength int
	GuildFetchLimit        int
	MessageLength          int
	MaxFileSize            int
}

type DisallowedWordsSettings struct {
	Username []string
	Guilds   []string
	Channels []string
	Global   []string
}

type CaptchaSettings struct {
	Login          bool
	Register       bool
	ForgotPassword bool
	ChangePassword bool
	ChangeEmail    bool
}

// Settings struct
type Settings struct {
	Max             MaxSettings
	Min             struct{}
	Captcha         CaptchaSettings
	DisallowedWords DisallowedWordsSettings
}

// GuildFeatures struct
type GuildFeatures struct {
	Name       string
	Deprecated bool
	Default    bool
	Settable   bool
	NewDefault bool
}

// AllowedMentions struct
type AllowedMentions struct {
	Everyone int
	Here     int
	Roles    int
	Users    int
	All      int
}

// GuildMemberFlags struct
type GuildMemberFlags struct {
	Left    int
	In      int
	Kicked  int
	Banned  int
	Owner   int
	CoOwner int
}

// ChannelTypes struct
type ChannelTypes struct {
	GuildCategory  int
	GuildText      int
	GuildNews      int
	GuildRules     int
	GuildVoice     int
	GuildNewMember int
	GuildMarkdown  int
	Dm             int
	GroupChat      int
}

// PresenceTypes struct
type PresenceTypes struct {
	Custom    int
	Playing   int
	Watching  int
	Listening int
	Streaming int
}

// StatusTypes struct
type StatusTypes struct {
	Offline   int
	Online    int
	Idle      int
	Dnd       int
	Invisible int
}

// MessageFlags struct
type MessageFlags struct {
	System   int
	Normal   int
	Deleted  int
	Reported int
}

// InviteFlags struct
type InviteFlags struct {
	Normal     int
	GroupChat  int
	FriendLink int
	Vanity     int
}

// PublicFlags struct
type PublicFlags struct {
	StaffBadge                 *big.Int
	GhostBadge                 *big.Int
	SponsorBadge               *big.Int
	DeveloperBadge             *big.Int
	VerifiedBotDeveloperBadge  *big.Int
	OriginalUserBadge          *big.Int
	PartnerBadge               *big.Int
	ModeratorBadge             *big.Int
	MinorBugHunterBadge        *big.Int
	IntermediateBugHunterBadge *big.Int
	MajorBugHunterBadge        *big.Int
}

// PrivateFlags struct
type PrivateFlags struct {
	Ghost                      *big.Int
	System                     *big.Int
	Staff                      *big.Int
	BetaTester                 *big.Int
	Bot                        *big.Int
	VerifiedBot                *big.Int
	Spammer                    *big.Int
	Tos                        *big.Int
	GuildBan                   *big.Int
	FriendBan                  *big.Int
	GroupchatBan               *big.Int
	WaitingOnAccountDeletion   *big.Int
	WaitingOnDisableDataUpdate *big.Int
	AccountDeleted             *big.Int
	EmailVerified              *big.Int
	Disabled                   *big.Int
	Terminated                 *big.Int
	TwoFaEnabled               *big.Int
	TwoFaVerified              *big.Int
	IncreasedGuildCount100     *big.Int
	IncreasedGuildCount200     *big.Int
	IncreasedGuildCount500     *big.Int
	IncreasedMessageLength2k   *big.Int
	IncreasedMessageLength4k   *big.Int
	IncreasedMessageLength8k   *big.Int
}

type Permission struct {
	Int            *big.Int
	Group          string
	SubPermissions map[string]*big.Int
}

// Permissions struct
type Permissions struct {
	Administrator   Permission
	Guild           Permission
	Roles           Permission
	Channels        Permission
	Members         Permission
	Emojis          Permission
	Moderation      Permission
	ManageNicknames Permission
	ManageInvites   Permission
}

// RelationshipFlags struct
type RelationshipFlags struct {
	None          int
	Blocked       int
	FriendRequest int
	Friend        int
	MutualFriend  int
}

// VerificationFlags struct
type VerificationFlags struct {
	VerifyEmail    int
	ForgotPassword int
	ChangeEmail    int
}

// PermissionOverrideTypes struct
type PermissionOverrideTypes struct {
	Role     int
	Member   int
	Everyone int
}

type Constants struct {
	Settings                 Settings
	GuildFeatures            []GuildFeatures
	AllowedMentions          AllowedMentions
	GuildMemberFlags         GuildMemberFlags
	ChannelTypes             ChannelTypes
	PresenceTypes            PresenceTypes
	StatusTypes              StatusTypes
	MessageFlags             MessageFlags
	// NonDeletableMessageFlags  should be an object of type MessageFlags
	NonDeletableMessageFlags MessageFlags
	InviteFlags              InviteFlags
	PublicFlags              PublicFlags
	PrivateFlags             PrivateFlags
	Permissions              Permissions
	RelationshipFlags        RelationshipFlags
	VerificationFlags        VerificationFlags
	PermissionOverrideTypes  PermissionOverrideTypes
}
