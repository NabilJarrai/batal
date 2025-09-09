package com.batal.service;

import com.batal.entity.User;
import com.batal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                .collect(Collectors.toList());

        return UserPrincipal.create(user, authorities);
    }

    public static class UserPrincipal implements UserDetails {
        private Long id;
        private String email;
        private String password;
        private List<GrantedAuthority> authorities;
        private boolean isActive;

        public UserPrincipal(Long id, String email, String password, 
                             List<GrantedAuthority> authorities, boolean isActive) {
            this.id = id;
            this.email = email;
            this.password = password;
            this.authorities = authorities;
            this.isActive = isActive;
        }

        public static UserPrincipal create(User user, List<GrantedAuthority> authorities) {
            return new UserPrincipal(
                    user.getId(),
                    user.getEmail(),
                    user.getPassword(),
                    authorities,
                    user.getIsActive()
            );
        }

        @Override
        public List<GrantedAuthority> getAuthorities() {
            return authorities;
        }

        @Override
        public String getPassword() {
            return password;
        }

        @Override
        public String getUsername() {
            return email;
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return isActive;
        }

        public Long getId() {
            return id;
        }

        public String getEmail() {
            return email;
        }
    }
}
