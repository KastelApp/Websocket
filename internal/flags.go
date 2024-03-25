package internal

import (
	"encoding/json"
	"fmt"
	"math/big"
)

type FlagUtilsBInt struct {
	bits  *big.Int
	Flags map[string]*big.Int
}

func NewFlagUtilsBInt(bits *big.Int, flags map[string]*big.Int) *FlagUtilsBInt {
	return &FlagUtilsBInt{
		bits:  new(big.Int).Set(bits),
		Flags: flags,
	}
}

// Has checks if a flag is present in the bitfield.
func (f *FlagUtilsBInt) Has(bit string) bool {
	flag, ok := f.Flags[bit]
	if !ok {
		return false
	}
	return new(big.Int).And(f.bits, flag).Cmp(flag) == 0
}

// Add adds a flag to the bitfield.
func (f *FlagUtilsBInt) Add(bit string) {
	flag, ok := f.Flags[bit]
	if !ok {
		return
	}
	f.bits.Or(f.bits, flag)
}

// Remove removes a flag from the bitfield.
func (f *FlagUtilsBInt) Remove(bit string) {
	flag, ok := f.Flags[bit]
	if !ok {
		return
	}
	f.bits.AndNot(f.bits, flag)
}

// ToJSON converts the bitfield to a JSON representation.
func (f *FlagUtilsBInt) ToJSON() (string, error) {
	flagsJSON := make(map[string]bool)
	for key := range f.Flags {
		flagsJSON[key] = f.Has(key)
	}
	jsonData, err := json.Marshal(flagsJSON)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// FlagFields represents a set of flags.
type FlagFields struct {
	PrivateFlags *FlagUtilsBInt
	PublicFlags  *FlagUtilsBInt
}

// NewFlagFields creates a new FlagFields instance.
func NewFlagFields(privateFlags, publicFlags *big.Int, privateFlagMap, publicFlagMap map[string]*big.Int) *FlagFields {
	return &FlagFields{
		PrivateFlags: NewFlagUtilsBInt(privateFlags, privateFlagMap),
		PublicFlags:  NewFlagUtilsBInt(publicFlags, publicFlagMap),
	}
}

func (f *FlagFields) ToJSON() (string, error) {
	privateJSON, err := f.PrivateFlags.ToJSON()
	if err != nil {
		return "", err
	}
	publicJSON, err := f.PublicFlags.ToJSON()
	if err != nil {
		return "", err
	}
	return fmt.Sprintf(`{"private": %s, "public": %s}`, privateJSON, publicJSON), nil
}

func (f *FlagFields) HasPrivateFlag(flag string) bool {
	return f.PrivateFlags.Has(flag)
}

func (f *FlagFields) HasPublicFlag(flag string) bool {
	return f.PublicFlags.Has(flag)
}

func (f *FlagFields) HasFlag(flag string) bool {
	return f.HasPrivateFlag(flag) || f.HasPublicFlag(flag)
}

func (f *FlagFields) AddPrivateFlag(flag string) {
	f.PrivateFlags.Add(flag)
}

func (f *FlagFields) AddPublicFlag(flag string) {
	f.PublicFlags.Add(flag)
}

func (f *FlagFields) AddFlag(flag string) {
	f.AddPrivateFlag(flag)
	f.AddPublicFlag(flag)
}

func (f *FlagFields) RemovePrivateFlag(flag string) {
	f.PrivateFlags.Remove(flag)
}

func (f *FlagFields) RemovePublicFlag(flag string) {
	f.PublicFlags.Remove(flag)
}

func (f *FlagFields) RemoveFlag(flag string) {
	f.RemovePrivateFlag(flag)
	f.RemovePublicFlag(flag)
}
